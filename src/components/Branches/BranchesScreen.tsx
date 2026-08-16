import React, { useState, useEffect } from 'react';
import { Store, Warehouse, Plus, Edit3, Trash2, Building2, MapPin, Phone, CheckCircle } from 'lucide-react';
import { Branch, Warehouse as WarehouseType } from '../../types';
import { getBranches, saveBranch, deleteBranch, getWarehouses, saveWarehouse } from '../../db/dbEngine';

export const BranchesScreen: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);

  // Branch Modal
  const [showBranchModal, setShowBranchModal] = useState<boolean>(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchFormData, setBranchFormData] = useState({
    code: '',
    name: '',
    phone: '',
    address: '',
    taxNumber: '',
    commercialReg: ''
  });

  // Warehouse Modal
  const [showWhModal, setShowWhModal] = useState<boolean>(false);
  const [whBranchId, setWhBranchId] = useState<string>('');
  const [whFormData, setWhFormData] = useState({
    code: '',
    name: ''
  });

  const loadData = () => {
    setBranches(getBranches());
    setWarehouses(getWarehouses());
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddBranchModal = () => {
    setEditingBranch(null);
    setBranchFormData({
      code: `BR-0${branches.length + 1}`,
      name: '',
      phone: '010',
      address: '',
      taxNumber: '321-456-789',
      commercialReg: '109845'
    });
    setShowBranchModal(true);
  };

  const openEditBranchModal = (br: Branch) => {
    setEditingBranch(br);
    setBranchFormData({
      code: br.code,
      name: br.name,
      phone: br.phone,
      address: br.address,
      taxNumber: br.taxNumber,
      commercialReg: br.commercialReg
    });
    setShowBranchModal(true);
  };

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchFormData.name.trim()) return;

    const newBranch: Branch = {
      id: editingBranch ? editingBranch.id : 'br_' + Date.now(),
      code: branchFormData.code.trim(),
      name: branchFormData.name.trim(),
      phone: branchFormData.phone.trim(),
      address: branchFormData.address.trim(),
      taxNumber: branchFormData.taxNumber.trim(),
      commercialReg: branchFormData.commercialReg.trim(),
      isDefault: editingBranch ? editingBranch.isDefault : false
    };

    saveBranch(newBranch);

    // Create a default warehouse for new branch if adding
    if (!editingBranch) {
      saveWarehouse({
        id: 'wh_' + Date.now(),
        branchId: newBranch.id,
        code: `WH-0${warehouses.length + 1}`,
        name: `المخزن الرئيسي - ${newBranch.name}`,
        isDefault: true
      });
    }

    setShowBranchModal(false);
    loadData();
  };

  const handleSaveWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whFormData.name.trim() || !whBranchId) return;

    saveWarehouse({
      id: 'wh_' + Date.now(),
      branchId: whBranchId,
      code: whFormData.code.trim(),
      name: whFormData.name.trim(),
      isDefault: false
    });

    setShowWhModal(false);
    loadData();
  };

  return (
    <div className="p-4 space-y-4 bg-slate-100 dark:bg-slate-900 min-h-[calc(100vh-62px)] select-none transition-colors">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-base text-slate-800 dark:text-slate-100">إدارة الفروع والمخازن</h2>
            <p className="text-xs text-slate-400 dark:text-slate-400">يمكنك إضافة وإدارة فروع السوبرماركت والمخازن التابعة لكل فرع</p>
          </div>
        </div>

        <button
          onClick={openAddBranchModal}
          disabled={branches.length >= 5}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 dark:disabled:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة فرع جديد ({branches.length}/5)</span>
        </button>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((br) => {
          const branchWhs = warehouses.filter(w => w.branchId === br.id);

          return (
            <div key={br.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs flex flex-col justify-between space-y-4">
              
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black flex items-center justify-center font-mono text-sm">
                      {br.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-slate-900 dark:text-slate-100">{br.name}</h3>
                        {br.isDefault && (
                          <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                            الفرع الافتراضي
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{br.address}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditBranchModal(br)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                {/* Tax / Phone Details */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-700/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-sans">رقم الهاتف</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{br.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-sans">الرقم الضريبي</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{br.taxNumber}</span>
                  </div>
                </div>

                {/* Warehouses list for this branch */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Warehouse className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      المخازن التابعة للفرع ({branchWhs.length})
                    </span>
                    <button
                      onClick={() => {
                        setWhBranchId(br.id);
                        setWhFormData({ code: `WH-0${warehouses.length + 1}`, name: '' });
                        setShowWhModal(true);
                      }}
                      className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> إضافة مخزن فرعي
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {branchWhs.map(w => (
                      <div key={w.id} className="p-2 bg-slate-100 dark:bg-slate-700/60 rounded-lg text-xs flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{w.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">{w.code}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          );
        })}
      </div>

      {/* Add / Edit Branch Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
              {editingBranch ? 'تعديل الفرع' : 'إضافة فرع جديد'}
            </h3>

            <form onSubmit={handleSaveBranch} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">كود الفرع</label>
                  <input
                    type="text"
                    value={branchFormData.code}
                    onChange={(e) => setBranchFormData({ ...branchFormData, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسم الفرع</label>
                  <input
                    type="text"
                    required
                    value={branchFormData.name}
                    onChange={(e) => setBranchFormData({ ...branchFormData, name: e.target.value })}
                    placeholder="مثال: فرع المعادي"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">العنوان التفصيلي</label>
                <input
                  type="text"
                  value={branchFormData.address}
                  onChange={(e) => setBranchFormData({ ...branchFormData, address: e.target.value })}
                  placeholder="مثال: شارع النصر، المعادي، القاهرة"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={branchFormData.phone}
                    onChange={(e) => setBranchFormData({ ...branchFormData, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الرقم الضريبي</label>
                  <input
                    type="text"
                    value={branchFormData.taxNumber}
                    onChange={(e) => setBranchFormData({ ...branchFormData, taxNumber: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer">
                  حفظ الفرع
                </button>
                <button type="button" onClick={() => setShowBranchModal(false)} className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold cursor-pointer">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Warehouse Modal */}
      {showWhModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mb-3">إضافة مخزن فرعي</h3>
            <form onSubmit={handleSaveWarehouse} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">كود المخزن</label>
                <input
                  type="text"
                  value={whFormData.code}
                  onChange={(e) => setWhFormData({ ...whFormData, code: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">اسم المخزن</label>
                <input
                  type="text"
                  required
                  value={whFormData.name}
                  onChange={(e) => setWhFormData({ ...whFormData, name: e.target.value })}
                  placeholder="مثال: مخزن صالة العرض"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer">حفظ المخزن</button>
                <button type="button" onClick={() => setShowWhModal(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
