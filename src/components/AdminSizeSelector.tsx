import React, { useState } from 'react';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { MenuItemSize, formatPrice } from '../lib/supabase';
import './AdminSizeSelector.css';

interface AdminSizeSelectorProps {
  sizes: MenuItemSize[];
  basePrice: number;
  onSizesChange: (sizes: MenuItemSize[]) => void;
}

const AdminSizeSelector: React.FC<AdminSizeSelectorProps> = ({
  sizes,
  basePrice,
  onSizesChange
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    size: string;
    price: number;
    available: boolean;
  }>({
    size: '',
    price: basePrice,
    available: true
  });

  const sizeOptions = ['Small', 'Medium', 'Large', 'Extra Large'] as const;
  const availableSizeOptions = sizeOptions.filter(
    option => !sizes.some(size => size.size === option)
  );

  const handleAddSize = () => {
    if (!editForm.size || editForm.price <= 0) return;

    const newSizes = [...sizes, {
      size: editForm.size as MenuItemSize['size'],
      price: editForm.price,
      available: editForm.available
    }];

    // Sort sizes by typical coffee size order
    const sizeOrder = { 'Small': 1, 'Medium': 2, 'Large': 3, 'Extra Large': 4 };
    newSizes.sort((a, b) => sizeOrder[a.size] - sizeOrder[b.size]);

    onSizesChange(newSizes);
    resetForm();
  };

  const handleEditSize = (index: number) => {
    const size = sizes[index];
    setEditingIndex(index);
    setEditForm({
      size: size.size,
      price: size.price,
      available: size.available
    });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const newSizes = sizes.map((size, index) =>
      index === editingIndex
        ? {
            ...size,
            price: editForm.price,
            available: editForm.available
          }
        : size
    );

    onSizesChange(newSizes);
    setEditingIndex(null);
    resetForm();
  };

  const handleDeleteSize = (index: number) => {
    const newSizes = sizes.filter((_, i) => i !== index);
    onSizesChange(newSizes);
  };

  const resetForm = () => {
    setEditForm({
      size: '',
      price: basePrice,
      available: true
    });
    setEditingIndex(null);
  };

  const generateDefaultSizes = () => {
    const defaultSizes: MenuItemSize[] = [
      { size: 'Small', price: basePrice, available: true },
      { size: 'Medium', price: basePrice + 0.75, available: true },
      { size: 'Large', price: basePrice + 1.50, available: true },
      { size: 'Extra Large', price: basePrice + 2.25, available: true }
    ];
    onSizesChange(defaultSizes);
  };

  return (
    <div className="admin-size-selector">
      <div className="size-selector-header">
        <h4>Size Options & Pricing</h4>
        <button
          type="button"
          className="generate-default-btn"
          onClick={generateDefaultSizes}
          title="Generate default sizes with standard pricing"
        >
          Generate Default Sizes
        </button>
      </div>

      {/* Current Sizes */}
      <div className="current-sizes">
        {sizes.length === 0 ? (
          <div className="no-sizes">
            <p>No sizes configured. Item will use base price only.</p>
          </div>
        ) : (
          <div className="sizes-grid">
            {sizes.map((size, index) => (
              <div key={index} className="size-item">
                {editingIndex === index ? (
                  <div className="size-edit-form">
                    <div className="edit-form-row">
                      <span className="size-name">{size.size}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.price}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          price: parseFloat(e.target.value) || 0
                        })}
                        className="price-input"
                        min="0"
                      />
                    </div>
                    <div className="edit-form-actions">
                      <label className="availability-toggle">
                        <input
                          type="checkbox"
                          checked={editForm.available}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            available: e.target.checked
                          })}
                        />
                        Available
                      </label>
                      <div className="edit-buttons">
                        <button
                          type="button"
                          className="save-edit-btn"
                          onClick={handleSaveEdit}
                        >
                          <Save size={14} />
                        </button>
                        <button
                          type="button"
                          className="cancel-edit-btn"
                          onClick={() => {
                            setEditingIndex(null);
                            resetForm();
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="size-display">
                    <div className="size-info">
                      <span className="size-name">{size.size}</span>
                      <span className="size-price">{formatPrice(size.price)}</span>
                      <span className={`size-status ${size.available ? 'available' : 'unavailable'}`}>
                        {size.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="size-actions">
                      <button
                        type="button"
                        className="edit-size-btn"
                        onClick={() => handleEditSize(index)}
                        title="Edit size"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        className="delete-size-btn"
                        onClick={() => handleDeleteSize(index)}
                        title="Delete size"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Size */}
      {availableSizeOptions.length > 0 && (
        <div className="add-size-section">
          <h5>Add New Size</h5>
          <div className="add-size-form">
            <div className="form-row">
              <select
                value={editForm.size}
                onChange={(e) => setEditForm({
                  ...editForm,
                  size: e.target.value
                })}
                className="size-select"
              >
                <option value="">Select Size</option>
                {availableSizeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              
              <input
                type="number"
                step="0.01"
                value={editForm.price}
                onChange={(e) => setEditForm({
                  ...editForm,
                  price: parseFloat(e.target.value) || 0
                })}
                placeholder="Price"
                className="price-input"
                min="0"
              />
            </div>
            
            <div className="form-row">
              <label className="availability-toggle">
                <input
                  type="checkbox"
                  checked={editForm.available}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    available: e.target.checked
                  })}
                />
                Available
              </label>
              
              <button
                type="button"
                className="add-size-btn"
                onClick={handleAddSize}
                disabled={!editForm.size || editForm.price <= 0}
              >
                <Plus size={16} />
                Add Size
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Size Pricing Tips */}
      <div className="size-pricing-tips">
        <h5>💡 Pricing Tips</h5>
        <ul>
          <li>Small: Base price (${basePrice.toFixed(2)})</li>
          <li>Medium: Usually +$0.50 to +$1.00</li>
          <li>Large: Usually +$1.00 to +$2.00</li>
          <li>Extra Large: Usually +$1.50 to +$3.00</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminSizeSelector;