import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { useModal } from '../../context/ModalContext';

export const AdminProductManager: React.FC = () => {
  const toast = useToast();
  const modal = useModal();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', parent_category_id: '', is_active: true });
  const [categorySubcategories, setCategorySubcategories] = useState<string[]>([]);
  const [categorySubcategoryInput, setCategorySubcategoryInput] = useState('');
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categorySubmitError, setCategorySubmitError] = useState('');
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);

  // Image State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);

  // Form State
  const initialFormState = {
    name: '',
    sku: '',
    category_id: '',
    subcategory_id: '',
    brand_id: '',
    price: '',
    discount_price: '',
    wholesale_price: '',
    status: 'ACTIVE' as const,
    weight: '0',
    is_featured: false
  };
  const [formData, setFormData] = useState(initialFormState);

  // Subcategories derived from the selected category
  const subcategories = React.useMemo(() => {
    if (!formData.category_id) return [];
    const selected = categories.find((c: any) => c.id === formData.category_id);
    return selected?.subcategories || [];
  }, [formData.category_id, categories]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        productService.getProducts({ limit: 100 }),
        productService.getCategories(),
        productService.getBrands()
      ]);
      setProducts(prodRes.data?.data || []);
      setCategories(catRes.data || []);
      setBrands(brandRes.data || []);
    } catch (err: any) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    // Reset subcategory when the category changes
    if (e.target.name === 'category_id') {
      setFormData({ ...formData, category_id: value as string, subcategory_id: '' });
    } else {
      setFormData({ ...formData, [e.target.name]: value });
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    try {
      setIsLoading(true);
      const generatedSku = formData.sku || `SKU-${Date.now()}`;

      const payload = {
        name: formData.name,
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id || undefined,
        brand_id: formData.brand_id ? Number(formData.brand_id) : undefined,
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : null,
        wholesale_price: formData.wholesale_price ? Number(formData.wholesale_price) : null,
        weight: Number(formData.weight),
        status: formData.status,
        sku: generatedSku,
        is_featured: formData.is_featured === true
      };

      const productResponse = await productService.createProduct(payload);

      const newProduct = productResponse.data;
      if (newProduct?.id && selectedFiles.length > 0) {
        try {
          const fileData = new FormData();
          selectedFiles.forEach(file => fileData.append('images', file));
          await productService.uploadProductImages(newProduct.id, fileData);
        } catch (uploadErr: any) {
          console.error(uploadErr);
          toast.error('Product created, but image upload failed.');
        }
      }

      setIsAddModalOpen(false);
      setFormData(initialFormState);
      setSelectedFiles([]);
      toast.success('Product created successfully');
      fetchData();
    } catch (err: any) {
      const rawMsg = err.data?.message || err.message || '';
      const isSkuError = rawMsg.includes('sku') || rawMsg.includes('constraint');
      setSubmitError(isSkuError ? 'SKU already exists. Please use a different SKU.' : 'Failed to create product. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      category_id: product.category_id,
      subcategory_id: product.subcategory_id || '',
      brand_id: product.brand_id ? product.brand_id.toString() : '',
      price: product.price.toString(),
      discount_price: product.discount_price ? product.discount_price.toString() : '',
      wholesale_price: product.wholesale_price ? product.wholesale_price.toString() : '',
      status: product.status,
      weight: product.weight?.toString() || '0',
      is_featured: product.is_featured ?? false
    });
    setExistingImages(product.images || []);
    setSelectedFiles([]);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    try {
      setIsLoading(true);
      await productService.updateProduct(editingProduct.id, {
        name: formData.name,
        sku: formData.sku || undefined,
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id || undefined,
        brand_id: formData.brand_id ? Number(formData.brand_id) : undefined,
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : null,
        wholesale_price: formData.wholesale_price ? Number(formData.wholesale_price) : null,
        weight: Number(formData.weight),
        status: formData.status,
        is_featured: formData.is_featured === true
      });

      if (selectedFiles.length > 0) {
        try {
          const fileData = new FormData();
          selectedFiles.forEach(file => fileData.append('images', file));
          await productService.uploadProductImages(editingProduct.id, fileData);
        } catch (uploadErr: any) {
          console.error(uploadErr);
          toast.error('Product updated, but image upload failed.');
        }
      }

      setIsEditModalOpen(false);
      setSelectedFiles([]);
      setExistingImages([]);
      toast.success('Product updated successfully');
      fetchData();
    } catch (err: any) {
      const rawMsg = err.data?.message || err.message || '';
      const isSkuError = rawMsg.includes('sku') || rawMsg.includes('constraint');
      setSubmitError(isSkuError ? 'SKU already exists. Please use a different SKU.' : 'Failed to update product. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setCategoryForm({ ...categoryForm, [target.name]: value });
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategorySubmitError('');
    setIsCategorySubmitting(true);
    try {
      const parentId = categoryForm.parent_category_id || null;
      const trimmedName = categoryForm.name.trim();
      const subNames = categorySubcategories.map((s) => s.trim()).filter((s) => s.length > 0);

      if (parentId) {
        // Mode: add subcategory(ies) to an existing parent category
        const namesToCreate = [...subNames];
        if (trimmedName) namesToCreate.push(trimmedName);
        if (namesToCreate.length === 0) {
          setCategorySubmitError('Please enter at least one subcategory name.');
          setIsCategorySubmitting(false);
          return;
        }
        await Promise.all(
          namesToCreate.map((name) =>
            productService.createCategory({
              name,
              parent_category_id: parentId,
              is_active: categoryForm.is_active,
            })
          )
        );
        toast.success(`Subcategory${namesToCreate.length > 1 ? 'ies' : ''} added successfully`);
      } else {
        // Mode: create a new top-level category
        if (!trimmedName) {
          setCategorySubmitError('Category name is required.');
          setIsCategorySubmitting(false);
          return;
        }
        const createdCategory = await productService.createCategory({
          name: trimmedName,
          description: categoryForm.description,
          is_active: categoryForm.is_active,
        });
        const categoryData = createdCategory.data;

        // If an image was selected, upload it
        if (categoryImageFile && categoryData?.id) {
          try {
            await productService.uploadCategoryImage(categoryData.id, categoryImageFile);
          } catch (uploadErr: any) {
            console.error(uploadErr);
            toast.error('Category created, but image upload failed.');
          }
        }

        // Create any subcategories added for this category
        if (categoryData?.id && subNames.length > 0) {
          try {
            await Promise.all(
              subNames.map((name) =>
                productService.createCategory({
                  name,
                  parent_category_id: categoryData.id,
                  is_active: true,
                })
              )
            );
          } catch (subErr: any) {
            console.error(subErr);
            toast.error('Category created, but some subcategories failed to save.');
          }
        }
        toast.success('Category created successfully');
      }

      setIsCategoryModalOpen(false);
      setCategoryForm({ name: '', description: '', parent_category_id: '', is_active: true });
      setCategorySubcategories([]);
      setCategorySubcategoryInput('');
      setCategoryImageFile(null);
      fetchData();
    } catch (err: any) {
      const rawMsg = err.data?.message || err.message || '';
      setCategorySubmitError(rawMsg || 'Failed to create category. Please check your inputs.');
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const addSubcategory = () => {
    const name = categorySubcategoryInput.trim();
    if (!name) return;
    if (categorySubcategories.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setCategorySubcategoryInput('');
      return;
    }
    setCategorySubcategories([...categorySubcategories, name]);
    setCategorySubcategoryInput('');
  };

  const removeSubcategory = (index: number) => {
    setCategorySubcategories(categorySubcategories.filter((_, i) => i !== index));
  };

  const handleDelete = async (id: string) => {
    const confirm = await modal.confirm('Delete Product', 'Are you sure you want to delete this product?');
    if (!confirm) return;
    try {
      setIsLoading(true);
      await productService.deleteProduct(id);
      toast.success('Product deleted successfully');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to delete product');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !p.sku?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (categoryFilter && p.category_id !== categoryFilter) return false;
    if (brandFilter && p.brand_id?.toString() !== brandFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl border border-border-design shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full lg:w-auto">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-border-design rounded px-3 py-2 text-[13px] w-full sm:w-64 placeholder-gray-400 text-gray-700"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-border-design rounded px-3 py-2 text-[13px] w-full sm:w-auto text-gray-700"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="border border-border-design rounded px-3 py-2 text-[13px] w-full sm:w-auto text-gray-700"
            >
              <option value="">All Brands</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => { setCategoryForm({ name: '', description: '', parent_category_id: '', is_active: true }); setCategorySubcategories([]); setCategorySubcategoryInput(''); setCategoryImageFile(null); setCategorySubmitError(''); setIsCategoryModalOpen(true); }}
              className="bg-orange-500 hover:bg-orange-600 text-white border-none rounded-xl py-2 px-4 text-[13px] font-bold cursor-pointer transition shadow-sm w-full sm:w-auto"
            >
              + Add Category
            </button>
            <button
              onClick={() => { setFormData(initialFormState); setIsAddModalOpen(true); }}
              className="bg-g1 hover:bg-g3 text-white border-none rounded-xl py-2 px-4 text-[13px] font-bold cursor-pointer transition shadow-sm w-full sm:w-auto"
            >
              + Add Product
            </button>
          </div>
        </div>
      </div>

      {false ? (
        null
      ) : (
        <div className="border border-border-design rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="bg-off border-b border-border-design p-4">
            <h3 className="font-extrabold text-[15px] text-[#0B8F3A] uppercase tracking-wide">Product Catalog</h3>
          </div>
          {filteredProducts.length === 0 && !isLoading ? (
            <div className="p-12 text-center text-gray-500 text-[13.5px]">No products found matching filters.</div>
          ) : (
            <>
              {/* Desktop Table View - Hidden on mobile/tablet */}
              <div className="hidden lg:block overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-border-design bg-off text-gray-700 font-semibold text-left">
                      <th className="p-3">Name</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Brand</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Wholesale Price</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Created</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-design">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border-design animate-pulse">
                          <td className="p-3"><div className="h-4 bg-gray-200 rounded w-28 mb-2"></div><div className="h-3 bg-gray-100 rounded w-16"></div></td>
                          <td className="p-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                          <td className="p-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                          <td className="p-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                          <td className="p-3"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                          <td className="p-3"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                          <td className="p-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                          <td className="p-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                          <td className="p-3 text-right"><div className="h-8 bg-gray-200 rounded w-20 ml-auto"></div></td>
                        </tr>
                      ))
                    ) : (
                      filteredProducts.map(product => (
                        <tr key={product.id} className="hover:bg-off">
                          <td data-label="Name" className="p-3 font-bold text-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded border border-border-design overflow-hidden bg-off shrink-0">
                                <img 
                                  src={product.images && product.images.length > 0 
                                    ? (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '') + product.images[0].image_url
                                    : 'https://via.placeholder.com/40x40?text=No+Image'
                                  } 
                                  alt="" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://via.placeholder.com/40x40?text=No+Image';
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="truncate font-semibold text-gray-800 text-[13.5px]">{product.name}</div>
                              </div>
                            </div>
                          </td>
                          <td data-label="SKU" className="p-3 font-bold text-gray-800 whitespace-nowrap">{product.sku || '-'}</td>
                          <td data-label="Category" className="p-3 text-gray-700 whitespace-nowrap">
                            {product.category?.name}
                            {product.subcategory?.name && <span className="text-gray-400"> / {product.subcategory.name}</span>}
                          </td>
                          <td data-label="Brand" className="p-3 text-gray-700 whitespace-nowrap">{product.brand?.name || '-'}</td>
                          <td data-label="Price" className="p-3 font-black text-[#0B8F3A] whitespace-nowrap">RM {parseFloat(product.price).toFixed(2)}</td>
                          <td data-label="Wholesale Price" className="p-3 font-bold text-orange-600 whitespace-nowrap">
                             {product.wholesale_price ? `RM ${parseFloat(product.wholesale_price).toFixed(2)}` : '-'}
                          </td>
                          <td data-label="Status" className="p-3 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${product.status === 'ACTIVE' ? 'bg-emerald-50 text-g1 border border-g1/10' : 'bg-red-50 text-red-800'
                              }`}>
                              {product.status}
                            </span>
                          </td>
                          <td data-label="Created" className="p-3 text-gray-700 whitespace-nowrap">{new Date(product.created_at).toLocaleDateString()}</td>
                          <td data-label="Actions" className="p-3 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openEditModal(product)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg font-bold text-[12px] transition-colors border-none cursor-pointer">Edit</button>
                              <button onClick={() => handleDelete(product.id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-bold text-[12px] transition-colors border-none cursor-pointer">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden divide-y divide-border-design">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 animate-pulse flex flex-col gap-3">
                      <div className="flex gap-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0"></div>
                        <div className="flex-1 py-1"><div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div><div className="h-3 bg-gray-100 rounded w-1/4"></div></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5"><div className="h-10 bg-gray-150 rounded-lg"></div><div className="h-10 bg-gray-150 rounded-lg"></div></div>
                    </div>
                  ))
                ) : (
                  filteredProducts.map(product => (
                    <div key={product.id} className="p-4 hover:bg-off transition-colors">
                     {/* Product Header with Image and Name */}
                     <div className="flex items-start gap-3 mb-3">
                       <div className="w-16 h-16 rounded-lg border-2 border-border-design overflow-hidden bg-off shrink-0">
                         <img 
                           src={product.images && product.images.length > 0 
                             ? (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '') + product.images[0].image_url
                             : 'https://via.placeholder.com/64x64?text=No+Image'
                           } 
                           alt="" 
                           className="w-full h-full object-cover"
                           onError={(e) => {
                             e.currentTarget.src = 'https://via.placeholder.com/64x64?text=No+Image';
                           }}
                         />
                       </div>
                       <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-[14px] leading-tight mb-1">{product.name}</h4>
                        <p className="text-[11px] text-gray-500 font-mono">{product.sku || 'No SKU'}</p>
                      </div>
                    </div>

                    {/* Product Details Grid */}
                    <div className="grid grid-cols-2 gap-2.5 mb-3 text-[12px]">
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Category</span>
                        <span className="text-gray-800 font-semibold">
                          {product.category?.name || '-'}
                          {product.subcategory?.name && <span className="text-gray-400"> / {product.subcategory.name}</span>}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Brand</span>
                        <span className="text-gray-800 font-semibold">{product.brand?.name || '-'}</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Price</span>
                        <span className="text-[#0B8F3A] font-black text-[13px]">RM {parseFloat(product.price).toFixed(2)}</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Wholesale Price</span>
                        <span className="text-orange-600 font-bold text-[13px]">{product.wholesale_price ? `RM ${parseFloat(product.wholesale_price).toFixed(2)}` : '-'}</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Status</span>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${product.status === 'ACTIVE' ? 'bg-emerald-50 text-g1 border border-g1/10' : 'bg-red-50 text-red-800'}`}>
                          {product.status}
                        </span>
                      </div>
                    </div>

                    {/* Created Date and Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="text-[11px] text-gray-500">
                        <span className="font-semibold">Created:</span> {new Date(product.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEditModal(product)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg font-bold text-[12px] transition-colors border-none cursor-pointer active:scale-95">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg font-bold text-[12px] transition-colors border-none cursor-pointer active:scale-95">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]">
            <div className="p-4 sm:p-5 border-b border-border-design flex justify-between items-center">
              <h2 className="font-black text-[16px] sm:text-[18px] text-[#0B8F3A]">{categoryForm.parent_category_id ? 'Add Subcategory' : 'Add New Category'}</h2>
              <button onClick={() => { setIsCategoryModalOpen(false); setCategoryForm({ name: '', description: '', parent_category_id: '', is_active: true }); setCategorySubcategories([]); setCategorySubcategoryInput(''); setCategorySubmitError(''); setCategoryImageFile(null); }} className="text-gray-500 hover:text-gray-800 font-bold text-[20px] p-1">&times;</button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto">
              {categorySubmitError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[13px] font-bold">
                  {categorySubmitError}
                </div>
              )}
              <form id="categoryForm" onSubmit={handleCategorySubmit} className="flex flex-col gap-4">
                {/* Parent Category (only relevant when creating a new top-level category) */}
                {!categoryForm.parent_category_id && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-gray-700">Parent Category</label>
                    <select
                      name="parent_category_id"
                      value={categoryForm.parent_category_id}
                      onChange={handleCategoryInputChange}
                      className="border border-border-design rounded px-3 py-2.5 text-[14px] text-gray-700"
                    >
                      <option value="">None (Top-level Category)</option>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <span className="text-[11px] text-gray-500">Select a parent to create this category as a subcategory of an existing one.</span>
                  </div>
                )}

                {categoryForm.parent_category_id ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-gray-700">Subcategory Name {categorySubcategories.length === 0 && '*'}</label>
                      <input
                        name="name"
                        value={categoryForm.name}
                        onChange={handleCategoryInputChange}
                        type="text"
                        className="border border-border-design rounded px-3 py-2.5 text-[14px] text-gray-700 placeholder-gray-400"
                        placeholder="e.g., Snacks"
                      />
                      <span className="text-[11px] text-gray-500">This subcategory will be added under the selected parent category. You can also add more below.</span>
                    </div>

                    {/* Additional Subcategories */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-gray-700">More Subcategories</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={categorySubcategoryInput}
                          onChange={(e) => setCategorySubcategoryInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubcategory(); } }}
                          placeholder="Add another subcategory name"
                          className="flex-1 border border-border-design rounded px-3 py-2.5 text-[14px] text-gray-700 placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={addSubcategory}
                          className="bg-g1 hover:bg-g3 text-white border-none rounded-xl px-4 text-[13px] font-bold cursor-pointer transition shrink-0"
                        >
                          + Add
                        </button>
                      </div>

                      {categorySubcategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {categorySubcategories.map((name, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1.5 bg-org/10 text-org border border-org/20 rounded-full px-3 py-1 text-[12px] font-bold"
                            >
                              {name}
                              <button
                                type="button"
                                onClick={() => removeSubcategory(index)}
                                className="text-org hover:text-red-600 font-black leading-none"
                                aria-label={`Remove ${name}`}
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <input type="checkbox" id="category_is_active" name="is_active" checked={categoryForm.is_active} onChange={handleCategoryInputChange} className="w-4 h-4 cursor-pointer" />
                      <label htmlFor="category_is_active" className="text-[13px] font-bold text-gray-800 cursor-pointer">Subcategory is Active</label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-gray-700">Category Name *</label>
                      <input required name="name" value={categoryForm.name} onChange={handleCategoryInputChange} type="text" className="border border-border-design rounded px-3 py-2.5 text-[14px] text-gray-700 placeholder-gray-400" placeholder="e.g., Food & Grocery" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-gray-700">Description</label>
                      <textarea name="description" value={categoryForm.description} onChange={handleCategoryInputChange} rows={3} className="border border-border-design rounded px-3 py-2.5 text-[14px] text-gray-700 placeholder-gray-400" placeholder="Optional category description" />
                    </div>

                    {/* Subcategories */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-gray-700">Subcategories</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={categorySubcategoryInput}
                          onChange={(e) => setCategorySubcategoryInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubcategory(); } }}
                          placeholder="Add a subcategory name"
                          className="flex-1 border border-border-design rounded px-3 py-2.5 text-[14px] text-gray-700 placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={addSubcategory}
                          className="bg-g1 hover:bg-g3 text-white border-none rounded-xl px-4 text-[13px] font-bold cursor-pointer transition shrink-0"
                        >
                          + Add
                        </button>
                      </div>
                      <span className="text-[11px] text-gray-500">These subcategories will be created under this new category.</span>

                      {categorySubcategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {categorySubcategories.map((name, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1.5 bg-org/10 text-org border border-org/20 rounded-full px-3 py-1 text-[12px] font-bold"
                            >
                              {name}
                              <button
                                type="button"
                                onClick={() => removeSubcategory(index)}
                                className="text-org hover:text-red-600 font-black leading-none"
                                aria-label={`Remove ${name}`}
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Category Image */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-gray-700">Category Image</label>
                      <label className="border border-border-design rounded px-3 py-2.5 text-[13px] bg-white cursor-pointer hover:bg-off transition flex items-center justify-center gap-2 font-bold text-gray-700 select-none">
                        <i className="fa-solid fa-cloud-arrow-up text-g1 text-[16px]"></i>
                        Choose Category Image
                        <input
                          type="file"
                          accept="image/jpeg, image/png, image/webp"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCategoryImageFile(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {categoryImageFile && (
                        <div className="mt-2 flex items-center gap-3">
                          <img
                            src={URL.createObjectURL(categoryImageFile)}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded-lg border border-border-design"
                          />
                          <span className="text-[12px] font-bold text-g1">{categoryImageFile.name}</span>
                        </div>
                      )}
                      <span className="text-[11px] text-gray-500">Upload a category image (JPG, PNG, WEBP). Max 5MB.</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <input type="checkbox" id="category_is_active" name="is_active" checked={categoryForm.is_active} onChange={handleCategoryInputChange} className="w-4 h-4 cursor-pointer" />
                      <label htmlFor="category_is_active" className="text-[13px] font-bold text-gray-800 cursor-pointer">Category is Active</label>
                    </div>
                  </>
                )}
              </form>
            </div>
            <div className="p-4 sm:p-5 border-t border-border-design flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 bg-off rounded-b-2xl">
              <button type="button" onClick={() => { setIsCategoryModalOpen(false); setCategoryForm({ name: '', description: '', parent_category_id: '', is_active: true }); setCategorySubcategories([]); setCategorySubcategoryInput(''); setCategorySubmitError(''); setCategoryImageFile(null); }} className="bg-white border border-border-design hover:bg-gray-50 text-txt rounded-xl py-2.5 px-5 text-[13px] font-bold transition w-full sm:w-auto">Cancel</button>
              <button form="categoryForm" type="submit" disabled={isCategorySubmitting} className="bg-orange-500 hover:bg-orange-600 text-white border-none rounded-xl py-2.5 px-5 text-[13px] font-bold transition w-full sm:w-auto">
                {isCategorySubmitting ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]">
            <div className="p-4 sm:p-5 border-b border-border-design flex justify-between items-center">
              <h2 className="font-black text-[16px] sm:text-[18px] text-[#0B8F3A]">{isEditModalOpen ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSubmitError(''); setSelectedFiles([]); setExistingImages([]); }} className="text-gray-500 hover:text-gray-800 font-bold text-[20px] p-1">&times;</button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto">
              {submitError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[13px] font-bold">
                  {submitError}
                </div>
              )}
              <form id="productForm" onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-gray-700">Product Name *</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} type="text" className="border border-border-design rounded px-3 py-2.5 text-[14px] text-gray-700 placeholder-gray-400" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-gray-700">SKU</label>
                  <input name="sku" value={formData.sku} onChange={handleInputChange} type="text" className="border border-border-design rounded px-3 py-2.5 text-[14px] text-gray-700 placeholder-gray-400" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-gray-700">Category *</label>
                    <select required name="category_id" value={formData.category_id} onChange={handleInputChange} className="border border-border-design rounded px-3 py-2.5 text-[14px] text-gray-700">
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-gray-700">Brand</label>
                    <select name="brand_id" value={formData.brand_id} onChange={handleInputChange} className="border border-border-design rounded px-3 py-2.5 text-[14px] text-gray-700">
                      <option value="">Select Brand</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-gray-700">Subcategory</label>
                  <select
                    name="subcategory_id"
                    value={formData.subcategory_id}
                    onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                    disabled={!formData.category_id || subcategories.length === 0}
                    className="border border-border-design rounded px-3 py-2.5 text-[14px] text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {!formData.category_id ? 'Select a category first' : (subcategories.length === 0 ? 'No subcategories' : 'Select Subcategory')}
                    </option>
                    {subcategories.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-gray-700">Price (RM) *</label>
                    <input required min="0" step="0.01" name="price" value={formData.price} onChange={handleInputChange} type="number" className="border border-border-design rounded px-3 py-2.5 text-[14px] text-gray-700 placeholder-gray-400" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-gray-700">Discount Price (RM)</label>
                    <input min="0" step="0.01" name="discount_price" value={formData.discount_price} onChange={handleInputChange} type="number" className="border border-border-design rounded px-3 py-2.5 text-[14px] text-gray-700 placeholder-gray-400" placeholder="Optional" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-gray-700">Wholesale Price (RM)</label>
                    <input min="0" step="0.01" name="wholesale_price" value={formData.wholesale_price} onChange={handleInputChange} type="number" className="border border-border-design rounded px-3 py-2.5 text-[14px] text-gray-700 placeholder-gray-400" placeholder="Optional" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-gray-700">Weight</label>
                    <input min="0" step="0.1" name="weight" value={formData.weight} onChange={handleInputChange} type="number" className="border border-border-design rounded px-3 py-2.5 text-[14px] text-gray-700 placeholder-gray-400" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-gray-700">Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="border border-border-design rounded px-3 py-2.5 text-[14px] text-gray-700">
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Featured Product Checkbox */}
                <div className="flex items-center gap-3 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="is_featured"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-gray-300 text-g1 focus:ring-g1 cursor-pointer"
                  />
                  <label htmlFor="is_featured" className="text-[13px] font-bold text-gray-700 cursor-pointer select-none">
                    Featured Product
                    <span className="block text-[11px] font-normal text-gray-500">Show this product in the Featured Products section on the homepage</span>
                  </label>
                </div>

                {/* Images Section */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[13px] font-bold text-gray-700">Product Images</label>

                  {isEditModalOpen && existingImages.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-2">
                      {existingImages.map((img, index) => (
                        <div key={img.id} className={`relative group w-20 h-20 sm:w-24 sm:h-24 border-2 rounded-lg overflow-hidden bg-off ${img.is_primary ? 'border-g1' : 'border-border-design'}`}>
                          <img 
                            src={
                              img.image_url.startsWith('http://') || img.image_url.startsWith('https://') || img.image_url.startsWith('//')
                                ? img.image_url
                                : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '') + img.image_url
                            } 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />

                          {/* Top Right: Delete */}
                          <button type="button" onClick={async () => {
                            if (await modal.confirm('Delete Image', 'Delete this image?')) {
                              try { await productService.deleteProductImage(editingProduct.id, img.id); setExistingImages(existingImages.filter(i => i.id !== img.id)); fetchData(); toast.success('Image deleted'); } catch (e) { toast.error('Failed to delete image'); }
                            }
                          }} className="absolute top-1 right-1 bg-white rounded-full w-5 h-5 flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 shadow transition">
                            <i className="fa-solid fa-times text-[10px]"></i>
                          </button>

                          {/* Bottom controls container */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-1 flex justify-between opacity-0 group-hover:opacity-100 transition">
                            <button type="button" disabled={index === 0} onClick={async () => {
                              const newImages = [...existingImages];
                              const temp = newImages[index - 1].sort_order;
                              newImages[index - 1].sort_order = newImages[index].sort_order;
                              newImages[index].sort_order = temp;
                              try {
                                const res = await productService.reorderProductImages(editingProduct.id, newImages.map(i => ({ id: i.id, sort_order: i.sort_order })));
                                setExistingImages(res.data); fetchData();
                              } catch (e) { }
                            }} className="text-white hover:text-g1 disabled:opacity-30"><i className="fa-solid fa-chevron-left text-[10px]"></i></button>

                            {!img.is_primary && (
                              <button type="button" onClick={async () => {
                                const newImages = existingImages.map(i => ({ ...i, is_primary: i.id === img.id }));
                                try {
                                  const res = await productService.reorderProductImages(editingProduct.id, newImages.map(i => ({ id: i.id, sort_order: i.sort_order, is_primary: i.is_primary })));
                                  setExistingImages(res.data); fetchData();
                                } catch (e) { }
                              }} className="text-white hover:text-g1 text-[10px] font-bold">Pri</button>
                            )}
                            {img.is_primary && <span className="text-g1 text-[10px] font-bold"><i className="fa-solid fa-star"></i></span>}

                            <button type="button" disabled={index === existingImages.length - 1} onClick={async () => {
                              const newImages = [...existingImages];
                              const temp = newImages[index + 1].sort_order;
                              newImages[index + 1].sort_order = newImages[index].sort_order;
                              newImages[index].sort_order = temp;
                              try {
                                const res = await productService.reorderProductImages(editingProduct.id, newImages.map(i => ({ id: i.id, sort_order: i.sort_order })));
                                setExistingImages(res.data); fetchData();
                              } catch (e) { }
                            }} className="text-white hover:text-g1 disabled:opacity-30"><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="border border-border-design rounded px-3 py-2.5 text-[13px] bg-white cursor-pointer hover:bg-off transition flex items-center justify-center gap-2 font-bold text-gray-700 select-none">
                    <i className="fa-solid fa-cloud-arrow-up text-g1 text-[16px]"></i>
                    Choose Product Images
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg, image/png, image/webp"
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files);
                          if (existingImages.length + files.length > 5) {
                            toast.warning('Maximum 5 images allowed total.');
                            setSelectedFiles(files.slice(0, 5 - existingImages.length));
                          } else {
                            setSelectedFiles(files);
                          }
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-gray-500">Select up to 5 images (JPG, PNG, WEBP). Max 5MB each.</span>

                  {selectedFiles.length > 0 && (
                    <div className="text-[12px] font-bold text-g1 mt-1">
                      {selectedFiles.length} new file(s) selected
                    </div>
                  )}
                </div>

              </form>
            </div>
            <div className="p-4 sm:p-5 border-t border-border-design flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 bg-off rounded-b-2xl">
              <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSubmitError(''); setSelectedFiles([]); setExistingImages([]); }} className="bg-white border border-border-design hover:bg-gray-50 text-txt rounded-xl py-2.5 px-5 text-[13px] font-bold transition w-full sm:w-auto">Cancel</button>
              <button form="productForm" type="submit" disabled={isLoading} className="bg-g1 hover:bg-g3 text-white border-none rounded-xl py-2.5 px-5 text-[13px] font-bold transition w-full sm:w-auto">
                {isLoading ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
