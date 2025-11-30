import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Star, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase, testConnection, type MenuItemDB, type MenuItemSize, createDefaultSizes } from '../lib/supabase';
import AdminSizeSelector from './AdminSizeSelector';
import './MenuManagement.css';

// MenuItemDB is now imported from supabase.ts

const MenuManagement: React.FC = () => {

  const [menuItems, setMenuItems] = useState<MenuItemDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemDB | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'coffee',
    image_url: '',
    icon: '☕',
    is_popular: false,
    sizes: [] as MenuItemSize[]
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [categories, setCategories] = useState([
    { value: 'coffee', label: 'Coffee', id: null },
    { value: 'espresso', label: 'Espresso', id: null },
    { value: 'cold', label: 'Cold Drinks', id: null },
    { value: 'food', label: 'Food', id: null },
    { value: 'pastries', label: 'Pastries', id: null },
    { value: 'seasonal', label: 'Seasonal', id: null }
  ]);

  const iconOptions = ['☕', '🧊', '🍵', '🍫', '🥐', '🧁', '🍪', '🥯', '🥨'];

  useEffect(() => {
    // Fetch initial data
    fetchMenuItems();
    fetchCategories();

    // Set up real-time subscription for menu items
    const subscription = supabase
      .channel('menu_items_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'menu_items'
      }, (payload) => {
        console.log('🔄 Real-time: Menu item change detected:', payload.eventType, payload.new || payload.old);
        // Small delay to ensure DB transaction is complete
        setTimeout(() => {
          fetchMenuItems();
        }, 500);
      })
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('id, name')
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.warn('⚠️ Could not fetch categories:', error);
        return;
      }

      if (data && data.length > 0) {
        const formattedCategories = data.map(cat => ({
          value: cat.name.toLowerCase().replace(' ', ''),
          label: cat.name,
          id: cat.id
        }));
        setCategories(formattedCategories);
      }
    } catch (error) {
      console.warn('⚠️ Error fetching categories:', error);
    }
  };

  const fetchMenuItems = async (retryCount = 0) => {
    const maxRetries = 2;
    
    try {
      console.log('🍽️ Menu Management: Fetching items from Supabase...');
      
      // Test connection first if this is the first try
      if (retryCount === 0) {
        const isConnected = await testConnection();
        if (!isConnected) {
          console.warn('⚠️ Menu Management: Connection test failed, using fallback');
          return;
        }
      }
      
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ Supabase fetch error:', error);
        if (retryCount < maxRetries) {
          console.log(`🔄 Retrying... (${retryCount + 1}/${maxRetries})`);
          setTimeout(() => fetchMenuItems(retryCount + 1), 2000);
          return;
        }
        console.log('⚠️ Menu Management: Max retries reached, keeping current state');
        return;
      }

      // Always update state with database data, even if empty
      console.log('✅ Menu Management: Loaded data from Supabase:', data?.length || 0, 'items');
      
      // Combine database data with fallback items if database is empty
      if (data && data.length > 0) {
        setMenuItems(data);
        console.log('📋 Using database items:', data.length);
      } else {
        console.log('📝 Database is empty - showing fallback items');
        setMenuItems([]);
      }
    } catch (error: any) {
      console.error('❌ Menu Management: Fetch failed:', error);
      
      if (error.message?.includes('timeout') && retryCount < maxRetries) {
        console.log(`🔄 Timeout, retrying... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => fetchMenuItems(retryCount + 1), 2000);
        return;
      }
      
      console.log('⚠️ Menu Management: Keeping current state due to network error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.image_url;
      
      // Upload image if selected
      if (selectedImage) {
        console.log('🖼️ Uploading selected image...');
        const uploadedUrl = await uploadImageToSupabase(selectedImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          console.log('✅ Image URL ready:', imageUrl);
        } else {
          console.warn('⚠️ Failed to upload image. Item will be saved without image.');
        }
      }

      // Find the category ID from the selected category
      const selectedCategory = categories.find(cat => cat.value === formData.category);
      const categoryId = selectedCategory?.id;

      const itemData = {
        name: formData.name,
        description: formData.description,
        base_price: parseFloat(formData.price), // Use base_price instead of price
        category_id: categoryId, // Use category_id instead of category
        image_url: imageUrl || null,
        is_available: true, // Add missing required field
        is_featured: formData.is_popular, // Map is_popular to is_featured
        sizes: formData.sizes.length > 0 ? formData.sizes : null // Add sizes to database
      };

      if (editingItem) {
        // Update existing item in database
        console.log('🔄 Updating item in Supabase:', formData.name);
        const { data, error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id)
          .select()
          .single();

        if (error) throw error;

        console.log('✅ Item updated in database:', data);
      } else {
        // Add new item to database
        console.log('🔄 Adding new item to Supabase:', formData.name);
        const { data, error } = await supabase
          .from('menu_items')
          .insert([itemData])
          .select()
          .single();

        if (error) throw error;

        console.log('✅ New item added to database:', data);
        console.log('📄 Full item data:', JSON.stringify(data, null, 2));
      }

      // Real-time subscription will handle updating the UI
      // Also manually refresh to ensure immediate update
      setTimeout(() => {
        console.log('🔄 Manual refresh after adding item...');
        fetchMenuItems();
      }, 1000);
      
      resetForm();
      
    } catch (error: any) {
      console.error('❌ Database operation failed:', error);
      alert(`Error ${editingItem ? 'updating' : 'adding'} item: ${error.message}`);
      
      // Fallback to local state as backup
      const fallbackItemData = {
        name: formData.name,
        description: formData.description,
        base_price: parseFloat(formData.price),
        category_id: selectedCategory?.id,
        image_url: imageUrl || null,
        is_available: true,
        is_featured: formData.is_popular,
        sizes: formData.sizes.length > 0 ? formData.sizes : null
      };

      const itemDataWithId = editingItem 
        ? { 
            ...fallbackItemData, 
            id: editingItem.id, 
            category_id: selectedCategory?.id || editingItem.category_id,
            created_at: editingItem.created_at, 
            updated_at: new Date().toISOString() 
          }
        : { 
            ...fallbackItemData, 
            id: `temp_${Date.now()}`, 
            category_id: selectedCategory?.id || categories[0]?.id || 'default',
            created_at: new Date().toISOString(), 
            updated_at: new Date().toISOString(),
            display_order: 0
          };

      if (editingItem) {
        const updatedItems = menuItems.map(item => 
          item.id === editingItem.id ? itemDataWithId as MenuItemDB : item
        );
        setMenuItems(updatedItems);
      } else {
        setMenuItems([itemDataWithId as MenuItemDB, ...menuItems]);
      }
      
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: MenuItemDB) => {
    setEditingItem(item);
    
    // Find category value from category_id
    const categoryValue = categories.find(cat => cat.id === item.category_id)?.value || 'coffee';
    
    setFormData({
      name: item.name,
      description: item.description,
      price: item.base_price.toString(), // Use base_price instead of price
      category: categoryValue, // Map category_id to category value
      image_url: item.image_url || '',
      icon: '☕', // Default icon since schema doesn't have icon field
      is_popular: item.is_featured, // Use is_featured instead of is_popular
      sizes: item.sizes || [] // Load existing sizes or empty array
    });
    setShowAddForm(true);
  };

  const handleDelete = async (item: MenuItemDB) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      console.log('🔄 Deleting item from Supabase:', item.name);
      const { error: deleteError } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', item.id);

      if (deleteError) throw deleteError;

      console.log('✅ Item deleted from database:', item.name);
      // Real-time subscription will handle updating the UI
      
    } catch (error: any) {
      console.error('❌ Database deletion failed:', error);
      alert(`Error deleting item: ${error.message}`);
      
      // Fallback: delete from local state
      const updatedItems = menuItems.filter(menuItem => menuItem.id !== item.id);
      setMenuItems(updatedItems);
      console.log('✅ Item deleted locally as fallback:', item.name);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'coffee',
      image_url: '',
      icon: '☕',
      is_popular: false,
      sizes: []
    });
    setEditingItem(null);
    setShowAddForm(false);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    try {
      console.log('🔄 Uploading image to Supabase storage...');
      
      // First, let's check if the bucket exists
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      console.log('📁 Available buckets:', buckets?.map(b => b.name));
      
      if (bucketError) {
        console.error('❌ Error checking buckets:', bucketError);
        console.log('🔄 Falling back to base64 storage...');
        return await convertImageToBase64(file);
      }
      
      // Check if menu-images bucket exists
      const bucketExists = buckets?.find(bucket => bucket.name === 'menu-images');
      if (!bucketExists) {
        console.error('❌ Storage bucket "menu-images" does not exist.');
        console.log('🔄 Falling back to base64 storage...');
        return await convertImageToBase64(file);
      }
      
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `menu-items/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Image upload failed:', uploadError);
        console.error('Error details:', uploadError.message);
        console.log('🔄 Falling back to base64 storage...');
        return await convertImageToBase64(file);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      console.log('✅ Image uploaded successfully to Supabase Storage:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('❌ Image upload error:', error);
      console.log('🔄 Falling back to base64 storage...');
      try {
        const base64Url = await convertImageToBase64(file);
        console.log('✅ Image converted to base64 successfully');
        return base64Url;
      } catch (base64Error) {
        console.error('❌ Base64 conversion failed:', base64Error);
        alert(`Image processing failed: ${error.message || 'Unknown error'}`);
        return null;
      }
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSizesChange = (sizes: MenuItemSize[]) => {
    setFormData(prev => ({
      ...prev,
      sizes
    }));
  };

  // Always show content immediately - no loading screen

  return (
    <div className="menu-management">
      <div className="menu-management-header">
        <h2>Menu Management</h2>
      </div>

      {/* Redesigned Add New Item Button */}
      <div className="add-item-section">
        <div className="add-item-card">
          <div className="add-item-icon">
            <Plus size={32} />
          </div>
          <div className="add-item-content">
            <h3>Add New Menu Item</h3>
            <p>Create a new coffee or food item for your menu</p>
          </div>
          <button 
            className="add-item-btn"
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h3>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
              <button className="close-btn" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="menu-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Item Name</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Signature Blend"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="price">Price (₱)</label>
                  <input
                    type="number"
                    id="price"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the item..."
                  required
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="icon">Icon</label>
                  <select
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => handleInputChange('icon', e.target.value)}
                  >
                    {iconOptions.map(icon => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="image_upload">Product Image (Optional)</label>
                <div className="image-upload-section">
                  <div className="image-upload-area">
                    <input
                      type="file"
                      id="image_upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="image_upload" className="upload-label">
                      <div className="upload-content">
                        {imagePreview ? (
                          <div className="image-preview">
                            <img src={imagePreview} alt="Preview" />
                            <div className="upload-overlay">
                              <Upload size={24} />
                              <span>Change Image</span>
                            </div>
                          </div>
                        ) : (
                          <div className="upload-placeholder">
                            <ImageIcon size={32} />
                            <span>Click to upload image</span>
                            <small>JPG, PNG, GIF up to 5MB</small>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                  
                  {selectedImage && (
                    <div className="image-info">
                      <span className="file-name">{selectedImage.name}</span>
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  
                </div>
              </div>

              {/* Size Configuration */}
              <AdminSizeSelector
                sizes={formData.sizes}
                basePrice={parseFloat(formData.price) || 0}
                onSizesChange={handleSizesChange}
              />

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_popular}
                    onChange={(e) => handleInputChange('is_popular', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Mark as Popular Item
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={loading}>
                  <Save size={16} />
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="menu-items-grid">
        {menuItems.map((item) => (
          <div key={item.id} className="menu-item-card">
            {item.is_featured && (
              <div className="popular-badge">
                <Star size={12} />
                Popular
              </div>
            )}
            
            <div className="item-image">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} />
              ) : (
                <span className="item-icon">☕</span>
              )}
            </div>

            <div className="item-details">
              <h3>{item.name}</h3>
              <p className="item-description">{item.description}</p>
              <div className="item-meta">
                <span className="item-category">{categories.find(c => c.id === item.category_id)?.label || 'Unknown'}</span>
                <div className="pricing-info">
                  {item.sizes && item.sizes.length > 0 ? (
                    <div className="size-pricing">
                      <span className="base-price">Base: ₱{item.base_price}</span>
                      <span className="size-count">{item.sizes.length} sizes</span>
                      <div className="size-range">
                        ₱{Math.min(...item.sizes.map(s => s.price))} - ₱{Math.max(...item.sizes.map(s => s.price))}
                      </div>
                    </div>
                  ) : (
                    <span className="item-price">₱{item.base_price}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="item-actions">
              <button 
                className="edit-btn"
                onClick={() => handleEdit(item)}
                title="Edit item"
              >
                <Edit size={16} />
              </button>
              <button 
                className="delete-btn"
                onClick={() => handleDelete(item)}
                title="Delete item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && !loading && (
        <div className="empty-state">
          <p>No menu items found. Add your first item to get started!</p>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;