import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { useModal } from '../../context/ModalContext';

export const AdminBrandManager: React.FC = () => {
  const toast = useToast();
  const modal = useModal();
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);

  // Form State
  const initialFormState = {
    name: '',
    is_active: true
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await productService.getBrands();
      setBrands(res.data || []);
    } catch (err: any) {
      toast.error('Failed to fetch brands');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setFormData({ ...formData, [target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        is_active: formData.is_active
      };

      if (editingBrand) {
        await productService.updateBrand(editingBrand.id, payload);
      } else {
        await productService.createBrand(payload);
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
      setEditingBrand(null);
      toast.success('Brand saved successfully');
      fetchData();
    } catch (err: any) {
      setSubmitError('Failed to save brand. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (brand: any) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      is_active: brand.is_active
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirm = await modal.confirm('Deactivate Brand', 'Are you sure you want to deactivate this brand?');
    if (!confirm) return;
    try {
      setIsLoading(true);
      await productService.deleteBrand(id);
      toast.success('Brand deactivated successfully');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to delete brand');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBrands = brands.filter(b => {
    if (searchTerm && !b.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-border-design shadow-sm">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-border-design rounded px-3 py-1.5 text-[13px] w-64 placeholder-gray-400 text-gray-700"
          />
        </div>
        <button
          onClick={() => { setFormData(initialFormState); setEditingBrand(null); setIsModalOpen(true); }}
          className="bg-g1 hover:bg-g3 text-white border-none rounded-xl py-2 px-4 text-[13px] font-bold cursor-pointer transition shadow-sm"
        >
          + Add Brand
        </button>
      </div>

      {isLoading && brands.length === 0 ? (
        <div className="text-center p-8 text-gray-500 font-bold text-[14px]">Loading brands...</div>
      ) : (
        <div className="border border-border-design rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="bg-off border-b border-border-design p-4">
            <h3 className="font-extrabold text-[15px] text-[#0B8F3A] uppercase tracking-wide">Brand Management</h3>
          </div>
          {filteredBrands.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-[13.5px]">No brands found.</div>
          ) : (
            <>
              {/* Desktop Table View - Hidden on mobile/tablet */}
              <div className="hidden lg:block overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-border-design bg-off text-gray-700 font-semibold text-left">
                      <th className="p-3">ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Slug</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-design">
                    {filteredBrands.map(brand => (
                      <tr key={brand.id} className="hover:bg-off">
                        <td className="p-3 font-mono text-[12px] text-gray-700">{brand.id}</td>
                        <td className="p-3 font-bold text-gray-800">{brand.name}</td>
                        <td className="p-3 font-mono text-[12px] text-gray-700">{brand.slug}</td>
                        <td className="p-3">
                          {brand.is_active ?
                            <span className="px-2 py-1 bg-org/10 text-org rounded-full text-[11px] font-bold">ACTIVE</span> :
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[11px] font-bold">INACTIVE</span>
                          }
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => openEditModal(brand)} className="text-[#0B8F3A] hover:text-g1 mr-3 text-[13px] font-bold underline">Edit</button>
                          <button onClick={() => handleDelete(brand.id)} className="text-red-500 hover:text-red-700 text-[13px] font-bold underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View - Hidden on desktop */}
              <div className="lg:hidden divide-y divide-border-design">
                {filteredBrands.map(brand => (
                  <div key={brand.id} className="p-4 hover:bg-off transition-colors">
                    {/* Brand Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-[14px] leading-tight mb-1">{brand.name}</h4>
                        <p className="text-[11px] text-gray-500 font-mono">ID: {brand.id}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                        brand.is_active ? 'bg-org/10 text-org' : 'bg-red-100 text-red-700'
                      }`}>
                        {brand.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    {/* Slug and Actions */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                      <div className="text-[11px] text-gray-500">
                        <span className="font-semibold">Slug:</span> <span className="font-mono">{brand.slug}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(brand)}
                          className="text-[#0B8F3A] hover:text-g1 px-3 py-2 rounded-lg text-[12px] font-bold transition-colors bg-blue-50 hover:bg-blue-100 border-none cursor-pointer active:scale-95"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
                          className="text-red-600 hover:text-red-700 px-3 py-2 rounded-lg text-[12px] font-bold transition-colors bg-red-50 hover:bg-red-100 border-none cursor-pointer active:scale-95"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-5 border-b border-border-design flex justify-between items-center bg-off">
              <h2 className="text-lg font-black text-[#0B8F3A]">{editingBrand ? 'Edit Brand' : 'Add Brand'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-800 text-xl font-bold leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              {submitError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-[13px] font-bold border border-red-100">
                  {submitError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">Name *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="border border-border-design rounded-lg px-3 py-2 text-[14px] text-gray-700 focus:outline-none focus:border-g1 placeholder-gray-400" />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="brand_is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-4 h-4 cursor-pointer" />
                <label htmlFor="brand_is_active" className="text-[13px] font-bold text-gray-800 cursor-pointer">Brand is Active</label>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-design">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-[13.5px] font-bold text-gray-500 hover:text-gray-800 transition">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-5 py-2 text-[13.5px] font-bold bg-g1 text-white rounded-xl hover:bg-g3 transition disabled:opacity-50">
                  {isLoading ? 'Saving...' : 'Save Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
