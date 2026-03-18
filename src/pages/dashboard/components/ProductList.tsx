import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Edit, Trash2, Loader } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useProducts, type Product } from '../../../context/ProductContext';
import { useSuppliers } from '../../../context/SupplierContext';
import { formatPrice } from '../../../utils/priceCalculations';

const columnHelper = createColumnHelper<Product>();

interface ProductListProps {
  filters: {
    search: string;
    category: string;
    status: string;
  };
  supplierFilter?: string;
}

export function ProductList({ filters, supplierFilter }: ProductListProps) {
  const navigate = useNavigate();
  const { products, deleteProduct, isLoading, error } = useProducts();
  const { suppliers } = useSuppliers();

  const getSupplierName = (supplierId: string | undefined) => {
    if (!supplierId) return 'No supplier';
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.companyName : 'Unknown supplier';
  };

  const columns = [
    columnHelper.accessor('artikelNr', {
      header: 'Artikel Nr.',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: info => (
        <div className="flex items-center space-x-3">
          {info.row.original.image && (
            <img
              src={info.row.original.image}
              alt={info.getValue()}
              className="h-10 w-10 object-cover rounded"
            />
          )}
          <span>{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor('vkPrice', {
      header: 'VK-Preis €',
      cell: info => formatPrice(info.getValue()),
    }),
    columnHelper.accessor('istBestand', {
      header: 'Ist Bestand',
      cell: info => {
        const stock = info.getValue();
        return (
          <span className={`${
            stock <= 0 ? 'text-red-600' :
            stock <= 10 ? 'text-yellow-600' :
            'text-green-600'
          } font-medium`}>
            {stock}
          </span>
        );
      },
    }),
    columnHelper.accessor('supplierId', {
      header: 'Supplier',
      cell: info => getSupplierName(info.getValue()),
    }),
    columnHelper.accessor('produktgruppe', {
      header: 'Produktgruppe',
      cell: info => info.getValue(),
    }),
    columnHelper.display({
      id: 'actions',
      cell: info => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/dashboard/products/${info.row.original.artikelNr}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this product?')) {
                deleteProduct(info.row.original.artikelNr);
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    }),
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.artikelNr.toLowerCase().includes(filters.search.toLowerCase());
      
    const matchesCategory = filters.category === 'All' || 
      product.produktgruppe === filters.category;
      
    const matchesStatus = filters.status === 'All' || 
      (filters.status === 'In Stock' && product.istBestand > 10) ||
      (filters.status === 'Low Stock' && product.istBestand <= 10 && product.istBestand > 0) ||
      (filters.status === 'Out of Stock' && product.istBestand <= 0);
    
    const matchesSupplier = !supplierFilter || product.supplierId === supplierFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesSupplier;
  });

  const table = useReactTable({
    data: filteredProducts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p>Error loading products: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}