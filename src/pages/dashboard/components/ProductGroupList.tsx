import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ProfitMarginDisplay } from '../../../components/ProfitMarginDisplay';
import { formatPrice } from '../../../utils/priceCalculations';
import type { Product } from '../../../types/product';

interface ProductGroupListProps {
  products: Product[];
  onDelete: (artikelNr: string) => void;
}

interface GroupedProducts {
  [key: string]: {
    [key: string]: Product[];
  };
}

export function ProductGroupList({ products, onDelete }: ProductGroupListProps) {
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});

  // Group products by produktgruppe and packungArt
  const groupedProducts = products.reduce<GroupedProducts>((acc, product) => {
    const group = product.produktgruppe;
    const type = product.packungArt;
    
    if (!acc[group]) {
      acc[group] = {};
    }
    if (!acc[group][type]) {
      acc[group][type] = [];
    }
    acc[group][type].push(product);
    return acc;
  }, {});

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedProducts).map(([group, types]) => (
        <div key={group} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={() => toggleGroup(group)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              {group}
            </h3>
            {expandedGroups[group] ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {expandedGroups[group] && (
            <div className="border-t">
              {Object.entries(types).map(([type, typeProducts]) => (
                <div key={type} className="p-4 border-b last:border-b-0">
                  <h4 className="text-md font-medium text-gray-700 mb-3">
                    {type}
                  </h4>
                  <div className="space-y-3">
                    {typeProducts.map(product => (
                      <div
                        key={product.artikelNr}
                        className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-start">
                            {product.image && (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded mr-4"
                              />
                            )}
                            <div>
                              <h5 className="font-medium text-gray-900">{product.name}</h5>
                              <p className="text-sm text-gray-500">Art. Nr: {product.artikelNr}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-8">
                          <div>
                            <p className="text-sm text-gray-500">EK Price</p>
                            <p className="font-medium">{formatPrice(product.ekPrice)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">VK Price</p>
                            <p className="font-medium">{formatPrice(product.vkPrice)}</p>
                          </div>
                          <ProfitMarginDisplay
                            ekPrice={product.ekPrice}
                            vkPrice={product.vkPrice}
                            mwst={product.mwst}
                          />
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/dashboard/products/${product.artikelNr}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDelete(product.artikelNr)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}