import React, { useState, useEffect } from 'react';

export const AdminBlogManager: React.FC = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', author: '', content: '', status: 'Published' });

  useEffect(() => {
    const saved = localStorage.getItem('Chennis_Blogs');
    if (saved) {
      setBlogs(JSON.parse(saved));
    }
  }, []);

  const saveBlogs = (newBlogs: any[]) => {
    setBlogs(newBlogs);
    localStorage.setItem('Chennis_Blogs', JSON.stringify(newBlogs));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBlog = {
      id: 'blog_' + Date.now(),
      ...formData,
      date: new Date().toLocaleDateString()
    };
    saveBlogs([newBlog, ...blogs]);
    setIsModalOpen(false);
    setFormData({ title: '', author: '', content: '', status: 'Published' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      saveBlogs(blogs.filter(b => b.id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-[28px] font-black text-g3 leading-none">Blog Management</h2>
          <p className="text-muted text-[13.5px] mt-1.5">Create and manage content for the public blog.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-g1 hover:bg-g3 text-white border-none rounded-xl py-2.5 px-5 text-[14px] font-bold cursor-pointer transition shadow-sm"
        >
          + Create Post
        </button>
      </div>

      <div className="border border-border-design rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="bg-off border-b border-border-design p-4">
          <h3 className="font-extrabold text-[15px] text-[#0B8F3A] uppercase tracking-wide">All Blog Posts</h3>
        </div>
        {blogs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-[13.5px]">No blog posts found. Create one to get started.</div>
        ) : (
          <>
            {/* Desktop Table View - Hidden on mobile/tablet */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse text-[13px] text-left">
                <thead>
                  <tr className="border-b border-border-design bg-off text-gray-700 font-semibold">
                    <th className="p-4">Title</th>
                    <th className="p-4">Author</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-design">
                  {blogs.map(blog => (
                    <tr key={blog.id} className="hover:bg-off transition-colors">
                      <td className="p-4 font-bold text-gray-800">{blog.title}</td>
                      <td className="p-4 text-gray-700">{blog.author}</td>
                      <td className="p-4 text-gray-700">{blog.date}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${blog.status === 'Published' ? 'bg-emerald-50 text-g1 border border-g1/10' : 'bg-amber-50 text-amber-700'}`}>
                          {blog.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDelete(blog.id)} className="text-red-500 hover:text-red-700 font-bold bg-transparent border-none cursor-pointer text-[12px]">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Hidden on desktop */}
            <div className="lg:hidden divide-y divide-border-design">
              {blogs.map(blog => (
                <div key={blog.id} className="p-4 hover:bg-off transition-colors">
                  {/* Blog Header */}
                  <div className="mb-3">
                    <h4 className="font-bold text-gray-800 text-[14px] leading-tight mb-2">{blog.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        blog.status === 'Published' ? 'bg-emerald-50 text-g1' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {blog.status}
                      </span>
                    </div>
                  </div>

                  {/* Blog Details */}
                  <div className="grid grid-cols-2 gap-2.5 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Author</span>
                      <span className="text-gray-800 font-semibold text-[12px]">{blog.author}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Date</span>
                      <span className="text-gray-800 font-semibold text-[12px]">{blog.date}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end pt-2.5 border-t border-gray-100">
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="text-red-600 hover:text-red-700 px-3 py-2 rounded-lg text-[12px] font-bold transition-colors bg-red-50 hover:bg-red-100 border-none cursor-pointer active:scale-95"
                    >
                      Delete Post
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
            <div className="p-5 border-b border-border-design flex justify-between items-center">
              <h2 className="font-black text-[18px] text-[#0B8F3A]">Create Blog Post</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-800 font-bold text-[20px] bg-transparent border-none cursor-pointer">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="blogForm" onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-gray-700">Post Title *</label>
                  <input required name="title" value={formData.title} onChange={handleInputChange} type="text" placeholder="e.g. 5 Benefits of Cold-Pressed Coconut Oil" className="border border-border-design rounded-lg px-4 py-2.5 text-[14px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-g1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-gray-700">Author *</label>
                    <input required name="author" value={formData.author} onChange={handleInputChange} type="text" placeholder="e.g. Chennis Admin" className="border border-border-design rounded-lg px-4 py-2.5 text-[14px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-g1" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-gray-700">Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="border border-border-design rounded-lg px-4 py-2.5 text-[14px] text-gray-700 focus:outline-none focus:border-g1 cursor-pointer">
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-gray-700">Content *</label>
                  <textarea required name="content" value={formData.content} onChange={handleInputChange} rows={8} placeholder="Write your blog post content here..." className="border border-border-design rounded-lg px-4 py-3 text-[14px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-g1 resize-y" />
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-border-design flex justify-end gap-3 bg-off rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="bg-white border border-border-design hover:bg-gray-50 text-txt rounded-xl py-2.5 px-6 text-[13px] font-bold transition cursor-pointer">Cancel</button>
              <button form="blogForm" type="submit" className="bg-g1 hover:bg-g3 text-white border-none rounded-xl py-2.5 px-6 text-[13px] font-bold transition cursor-pointer shadow-sm">
                Publish Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
