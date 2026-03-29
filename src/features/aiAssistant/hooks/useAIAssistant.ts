import { useState, useRef, useCallback } from 'react';
import { GoogleGenerativeAI, SchemaType, type ChatSession, type Tool, type Part } from '@google/generative-ai';
import { useOrders } from '../../../context/OrderContext';
import { useProducts } from '../../../context/ProductContext';
import { useCustomers } from '../../../context/CustomerContext';
import { useSuppliers } from '../../../context/SupplierContext';
import { calculateOrderTotal } from '../../../utils/orderCalculations';
import type { OrderItem, Order } from '../../../types/order';
import type { ChatMessage, ToolCallStatus } from '../types';

// ─── helpers ────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip data URL prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Gemini tool declarations ────────────────────────────────────────────────

const AI_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'search_products',
        description:
          'Search the product catalog by name or artikelNr. Use this before creating orders to find the correct artikelNr and prices.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description: 'Search term — product name, artikelNr, or keywords like "Cola"',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'search_customers',
        description: 'Find a customer by company name or contact person. Always call this before create_order.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description: 'Customer company name or contact person name to search for',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'create_order',
        description:
          'Create a new order in the system. Only call this after confirming the order details with the user.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            customer_id: {
              type: SchemaType.STRING,
              description: 'Customer UUID obtained from search_customers',
            },
            items: {
              type: SchemaType.ARRAY,
              description: 'List of order items',
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  artikelNr: {
                    type: SchemaType.STRING,
                    description: 'Product artikelNr from the catalog',
                  },
                  quantity: {
                    type: SchemaType.NUMBER,
                    description: 'Quantity to order',
                  },
                },
                required: ['artikelNr', 'quantity'],
              },
            },
            delivery_date: {
              type: SchemaType.STRING,
              description: 'Optional ISO date string for delivery, e.g. "2026-03-30"',
            },
            notes: {
              type: SchemaType.STRING,
              description: 'Optional order notes',
            },
          },
          required: ['customer_id', 'items'],
        },
      },
      {
        name: 'get_pending_orders',
        description: 'Get a list of pending and processing orders, optionally filtered by date.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            date: {
              type: SchemaType.STRING,
              description: 'Optional ISO date string e.g. "2026-03-29". Defaults to today.',
            },
          },
        },
      },
      {
        name: 'get_order_summary',
        description: 'Get a summary — count and total value of orders for a given date.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            date: {
              type: SchemaType.STRING,
              description: 'ISO date string e.g. "2026-03-29". Defaults to today.',
            },
          },
        },
      },
      {
        name: 'get_dashboard_stats',
        description:
          'Get overall app stats: total active orders, revenue from completed orders, product count, customer count.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
        },
      },
    ],
  },
];

// ─── hook ────────────────────────────────────────────────────────────────────

export function useAIAssistant() {
  const { orders, addOrder } = useOrders();
  const { products } = useProducts();
  const { customers } = useCustomers();
  const { suppliers } = useSuppliers();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const chatSessionRef = useRef<ChatSession | null>(null);

  // ── system prompt ──────────────────────────────────────────────────────────

  const buildSystemPrompt = useCallback((): string => {
    // Keep prompt small — products are NOT injected here to avoid huge context.
    // The AI uses search_products tool to look up products on demand.
    const customerList = customers
      .map((c) => `${c.id}|${c.companyName}|${c.contactPerson}`)
      .join('\n');

    const supplierList = suppliers.map((s) => `${s.id}|${s.companyName}`).join('\n');

    const today = new Date().toDateString();
    const todayOrders = orders
      .filter((o) => new Date(o.orderDate).toDateString() === today)
      .map(
        (o) =>
          `${o.id}|${o.customer.companyName}|${o.status}|€${o.finalAmount.toFixed(2)}`,
      )
      .join('\n');

    return `You are the AI assistant for "der Stern", a German wholesale management app.
Today is ${new Date().toLocaleDateString('de-DE')}.
Users are warehouse managers — respond in the same language they use (German or English).
Be concise. Use € for prices.

App stats: ${products.length} products, ${customers.length} customers, ${suppliers.length} suppliers.

## CUSTOMERS (id|companyName|contactPerson)
${customerList || 'No customers yet.'}

## SUPPLIERS (id|companyName)
${supplierList || 'No suppliers yet.'}

## TODAY'S ACTIVE ORDERS (orderId|customer|status|total)
${todayOrders || 'No active orders today.'}

## TOOLS
- search_products(query): search product catalog by name or artikelNr
- search_customers(query): find customer by name
- create_order(customer_id, items, delivery_date?, notes?): place a new order
- get_pending_orders(date?): list pending/processing orders
- get_order_summary(date?): count + totals for a date
- get_dashboard_stats(): revenue, counts

## RULES
1. Use search_customers BEFORE create_order to get the customer UUID.
2. Use search_products BEFORE create_order to confirm artikelNr + price.
3. Before calling create_order, summarize (customer, items, total) and ask for confirmation. Only proceed after user confirms.
4. For image uploads: extract customer + items from image, then use tools.
5. Never invent artikelNr values — only use ones found via search_products.`.trim();
  }, [orders, products.length, customers, suppliers]);

  // ── init / reset chat session ─────────────────────────────────────────────

  const initChatSession = useCallback(() => {
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    // thinkingBudget:0 disables extended thinking on gemini-2.5-flash,
    // making responses ~1s instead of 30-60s. Not in older SDK typedefs
    // but accepted by the REST API — use `as any` to bypass TS check.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const noThinkConfig = {
      temperature: 0.2,
      maxOutputTokens: 1024,
      thinkingConfig: { thinkingBudget: 0 },
    } as any;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: AI_TOOLS,
      systemInstruction: buildSystemPrompt(),
      generationConfig: noThinkConfig,
    });
    chatSessionRef.current = model.startChat({
      history: [],
      generationConfig: noThinkConfig,
    });
    setMessages([
      {
        id: uid(),
        role: 'assistant',
        content:
          "Hi! I'm your der Stern AI assistant. I can answer questions about your orders, search products and customers, or create new orders for you. You can also send me a photo of an order note and I'll read it!\n\nHow can I help?",
        timestamp: new Date(),
      },
    ]);
  }, [buildSystemPrompt]);

  // ── tool execution ─────────────────────────────────────────────────────────

  const executeSearchProducts = (query: string): string => {
    const q = query.toLowerCase();
    const results = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.artikelNr.toLowerCase().includes(q) ||
          (p.bestellnummer ?? '').toLowerCase().includes(q),
      )
      .slice(0, 10);

    if (results.length === 0) return `No products found for "${query}".`;
    return results
      .map(
        (p) =>
          `artikelNr:${p.artikelNr} | name:${p.name} | vkPrice:€${p.vkPrice.toFixed(2)} | ekPrice:€${p.ekPrice.toFixed(2)} | mwst:${p.mwst} | supplierId:${p.supplierId ?? 'none'}`,
      )
      .join('\n');
  };

  const executeSearchCustomers = (query: string): string => {
    const q = query.toLowerCase();
    const results = customers
      .filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.contactPerson.toLowerCase().includes(q),
      )
      .slice(0, 5);

    if (results.length === 0) return `No customers found for "${query}".`;
    return results
      .map(
        (c) =>
          `id:${c.id} | company:${c.companyName} | contact:${c.contactPerson} | address:${c.address}`,
      )
      .join('\n');
  };

  const executeGetPendingOrders = (date?: string): string => {
    const filterDate = date ? new Date(date) : new Date();
    const dateStr = filterDate.toDateString();
    const filtered = orders.filter((o) => {
      const matchDate = new Date(o.orderDate).toDateString() === dateStr;
      const isPending = o.status === 'Pending' || o.status === 'Processing';
      return isPending && matchDate;
    });

    if (filtered.length === 0) return `No pending orders found for ${dateStr}.`;
    return filtered
      .map(
        (o) =>
          `id:${o.id} | customer:${o.customer.companyName} | status:${o.status} | items:${o.items.length} | total:€${o.finalAmount.toFixed(2)}`,
      )
      .join('\n');
  };

  const executeGetOrderSummary = (date?: string): string => {
    const filterDate = date ? new Date(date) : new Date();
    const dateStr = filterDate.toDateString();
    const dayOrders = orders.filter(
      (o) => new Date(o.orderDate).toDateString() === dateStr,
    );
    const pending = dayOrders.filter(
      (o) => o.status === 'Pending' || o.status === 'Processing',
    );
    const completed = dayOrders.filter((o) => o.status === 'Completed');
    const totalValue = dayOrders.reduce((s, o) => s + o.finalAmount, 0);

    return `Date: ${dateStr} | Total orders: ${dayOrders.length} | Pending: ${pending.length} | Completed: ${completed.length} | Total value: €${totalValue.toFixed(2)}`;
  };

  const executeGetDashboardStats = (): string => {
    const active = orders.filter(
      (o) => o.status === 'Pending' || o.status === 'Processing',
    ).length;
    const completedRevenue = orders
      .filter((o) => o.status === 'Completed')
      .reduce((s, o) => s + o.finalAmount, 0);
    return `Active orders: ${active} | Revenue (completed): €${completedRevenue.toFixed(2)} | Products: ${products.length} | Customers: ${customers.length}`;
  };

  const executeCreateOrder = async (args: {
    customer_id: string;
    items: { artikelNr: string; quantity: number }[];
    delivery_date?: string;
    notes?: string;
  }): Promise<string> => {
    const customer = customers.find((c) => c.id === args.customer_id);
    if (!customer)
      return `Error: Customer with id "${args.customer_id}" not found.`;

    const resolvedItems: OrderItem[] = [];
    for (const req of args.items) {
      const product = products.find((p) => p.artikelNr === req.artikelNr);
      if (!product)
        return `Error: Product with artikelNr "${req.artikelNr}" not found in catalog.`;
      resolvedItems.push({
        product: {
          artikelNr: product.artikelNr,
          name: product.name,
          mwst: product.mwst,
          supplierId: product.supplierId,
        },
        quantity: req.quantity,
        ekPrice: product.ekPrice,
        vkPrice: product.vkPrice,
        total: parseFloat((req.quantity * product.vkPrice).toFixed(2)),
      });
    }

    if (resolvedItems.length === 0) return 'Error: No valid items to create order.';

    const { totalAmount, finalAmount } = calculateOrderTotal(resolvedItems);

    const orderData: Omit<Order, 'id'> = {
      customer: {
        id: customer.id,
        companyName: customer.companyName,
        contactPerson: customer.contactPerson,
        email: customer.email,
        idNumber: customer.idNumber,
        address: customer.address,
        billingAddress: customer.billingAddress,
      },
      items: resolvedItems,
      status: 'Pending',
      totalAmount,
      finalAmount,
      orderDate: new Date(),
      deliveryDate: args.delivery_date ? new Date(args.delivery_date) : undefined,
      paymentStatus: 'Pending',
      shippingAddress: customer.address,
      notes: args.notes,
    };

    await addOrder(orderData);

    const itemSummary = resolvedItems
      .map((i) => `${i.quantity}x ${i.product.name}`)
      .join(', ');
    return `Order created successfully for ${customer.companyName}. Items: ${itemSummary}. Total: €${finalAmount.toFixed(2)}.`;
  };

  const dispatchTool = async (name: string, args: Record<string, unknown>): Promise<string> => {
    switch (name) {
      case 'search_products':
        return executeSearchProducts(args.query as string);
      case 'search_customers':
        return executeSearchCustomers(args.query as string);
      case 'get_pending_orders':
        return executeGetPendingOrders(args.date as string | undefined);
      case 'get_order_summary':
        return executeGetOrderSummary(args.date as string | undefined);
      case 'get_dashboard_stats':
        return executeGetDashboardStats();
      case 'create_order':
        return await executeCreateOrder(
          args as {
            customer_id: string;
            items: { artikelNr: string; quantity: number }[];
            delivery_date?: string;
            notes?: string;
          },
        );
      default:
        return `Unknown tool: ${name}`;
    }
  };

  // ── message state helpers ──────────────────────────────────────────────────

  const addMessage = (msg: ChatMessage) =>
    setMessages((prev) => [...prev, msg]);

  const updateLastAssistantMessage = (
    updater: (msg: ChatMessage) => ChatMessage,
  ) => {
    setMessages((prev) => {
      const idx = [...prev].reverse().findIndex((m) => m.role === 'assistant');
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      const updated = [...prev];
      updated[realIdx] = updater(updated[realIdx]);
      return updated;
    });
  };

  // ── sendMessage ────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string, imageFile?: File) => {
      if (!chatSessionRef.current) initChatSession();
      const session = chatSessionRef.current!;

      // Add user message
      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: text || '(image)',
        imagePreview: imageFile ? URL.createObjectURL(imageFile) : undefined,
        timestamp: new Date(),
      };
      addMessage(userMsg);

      // Placeholder assistant message with loading state
      const assistantMsgId = uid();
      addMessage({
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        isLoading: true,
        toolCalls: [],
        timestamp: new Date(),
      });

      setIsLoading(true);

      try {
        // Build parts array
        const parts: Part[] = [];
        if (imageFile) {
          const base64Data = await fileToBase64(imageFile);
          parts.push({
            inlineData: { data: base64Data, mimeType: imageFile.type },
          });
        }
        if (text) {
          parts.push({ text });
        } else if (!imageFile) {
          return; // nothing to send
        }

        let response = await session.sendMessage(parts);

        // Agentic tool call loop
        const toolCallStatuses: ToolCallStatus[] = [];

        while (true) {
          const candidate = response.candidates?.[0];
          const responseParts = candidate?.content?.parts ?? [];
          const funcCalls = responseParts.filter((p) => p.functionCall);

          if (funcCalls.length === 0) break;

          // Process tool calls
          const functionResults: Part[] = [];
          for (const part of funcCalls) {
            const { name, args } = part.functionCall!;
            const humanName = toolHumanName(name);

            // Show pending status
            const tc: ToolCallStatus = {
              name,
              status: 'pending',
              summary: `${humanName}...`,
            };
            toolCallStatuses.push(tc);
            updateLastAssistantMessage((msg) => ({
              ...msg,
              toolCalls: [...toolCallStatuses],
            }));

            let result: string;
            try {
              result = await dispatchTool(name, args as Record<string, unknown>);
              tc.status = 'success';
              tc.summary = summarizeTool(name, result);
            } catch (err: any) {
              result = `Error: ${err.message}`;
              tc.status = 'error';
              tc.summary = result;
            }

            // Update status in UI
            updateLastAssistantMessage((msg) => ({
              ...msg,
              toolCalls: [...toolCallStatuses],
            }));

            functionResults.push({
              functionResponse: { name, response: { result } },
            });
          }

          response = await session.sendMessage(functionResults);
        }

        // Final text response
        const finalText = response.response.text();
        setMessages((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((m) => m.id === assistantMsgId);
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              content: finalText,
              isLoading: false,
              toolCalls: toolCallStatuses.length > 0 ? toolCallStatuses : undefined,
            };
          }
          return updated;
        });
      } catch (err: any) {
        setMessages((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((m) => m.id === assistantMsgId);
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              content: `Sorry, something went wrong: ${err?.message ?? 'Unknown error'}. Please try again.`,
              isLoading: false,
            };
          }
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initChatSession, orders, products, customers, suppliers],
  );

  const resetChat = useCallback(() => {
    initChatSession();
  }, [initChatSession]);

  const open = useCallback(() => {
    setIsOpen(true);
    if (!chatSessionRef.current) {
      initChatSession();
    }
  }, [initChatSession]);

  const close = useCallback(() => setIsOpen(false), []);

  return {
    messages,
    isLoading,
    isOpen,
    open,
    close,
    sendMessage,
    resetChat,
  };
}

// ─── display helpers ─────────────────────────────────────────────────────────

function toolHumanName(name: string): string {
  const map: Record<string, string> = {
    search_products: 'Searching products',
    search_customers: 'Searching customers',
    create_order: 'Creating order',
    get_pending_orders: 'Loading pending orders',
    get_order_summary: 'Getting order summary',
    get_dashboard_stats: 'Loading dashboard stats',
  };
  return map[name] ?? name;
}

function summarizeTool(name: string, result: string): string {
  if (result.startsWith('Error:')) return result;
  const lines = result.split('\n').length;
  switch (name) {
    case 'search_products':
      return `Found ${lines} product${lines !== 1 ? 's' : ''}`;
    case 'search_customers':
      return `Found ${lines} customer${lines !== 1 ? 's' : ''}`;
    case 'create_order':
      return result; // already a good summary
    case 'get_pending_orders':
      return `${lines} pending order${lines !== 1 ? 's' : ''}`;
    case 'get_order_summary':
      return result;
    case 'get_dashboard_stats':
      return result;
    default:
      return 'Done';
  }
}
