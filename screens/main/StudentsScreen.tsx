import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, updateStudent, deleteStudent, adjustBalance, addTransaction } from '../../store';
import { Search, UserCheck, Plus, Trash2, Edit, Award, ShoppingCart, MessageSquare, AlertCircle } from 'lucide-react-native';

export default function StudentsScreen() {
  const dispatch = useDispatch();
  const students = useSelector((state: RootState) => state.students.list);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'On Hold' | 'Completed'>('All');
  const [filterAge, setFilterAge] = useState<'All' | 'Kids' | 'Teens' | 'Adults'>('All');

  // Selected student details / editing state
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [buyHoursModal, setBuyHoursModal] = useState(false);
  const [buyHoursAmount, setBuyHoursAmount] = useState('10');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [editAgeGroup, setEditAgeGroup] = useState<'Kids' | 'Teens' | 'Adults'>('Adults');
  const [editStatus, setEditStatus] = useState<'Active' | 'On Hold' | 'Completed'>('Active');
  const [editNotes, setEditNotes] = useState('');

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) || 
                          student.email.toLowerCase().includes(search.toLowerCase()) ||
                          student.phone.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || student.status === filterStatus;
    const matchesAge = filterAge === 'All' || student.ageGroup === filterAge;
    return matchesSearch && matchesStatus && matchesAge;
  });

  const handleOpenEdit = (student: any) => {
    setSelectedStudent(student);
    setEditName(student.name);
    setEditEmail(student.email);
    setEditPhone(student.phone);
    setEditLevel(student.level);
    setEditAgeGroup(student.ageGroup);
    setEditStatus(student.status);
    setEditNotes(student.notes || '');
    setEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!selectedStudent || !editName || !editEmail) return;
    dispatch(updateStudent({
      ...selectedStudent,
      name: editName,
      email: editEmail,
      phone: editPhone,
      level: editLevel,
      ageGroup: editAgeGroup,
      status: editStatus,
      notes: editNotes
    }));
    setEditModal(false);
    setSelectedStudent(null);
  };

  const handleDelete = (id: string) => {
    dispatch(deleteStudent(id));
    if (selectedStudent?.id === id) {
      setSelectedStudent(null);
    }
  };

  const handleBuyHours = () => {
    if (!selectedStudent || !buyHoursAmount) return;
    const hours = parseInt(buyHoursAmount, 10) || 0;
    if (hours <= 0) return;

    const price = hours * 25; // $25 per hour
    
    // Add transaction log
    dispatch(addTransaction({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      amount: price,
      type: 'Income',
      category: 'Tuition',
      date: new Date().toISOString().split('T')[0],
      description: `Покупка пакета занятий: зачислены часы (${hours} ч.)`
    }));

    // Reward balance & statistics
    dispatch(updateStudent({
      ...selectedStudent,
      balance: selectedStudent.balance + hours,
      totalClasses: selectedStudent.totalClasses + hours,
      totalPaid: selectedStudent.totalPaid + price
    }));

    setBuyHoursModal(false);
    setBuyHoursAmount('10');
    // Refresh local selected state
    setSelectedStudent({
      ...selectedStudent,
      balance: selectedStudent.balance + hours,
      totalClasses: selectedStudent.totalClasses + hours,
      totalPaid: selectedStudent.totalPaid + price
    });
  };

  const statusLabels: Record<string, string> = {
    All: 'Все',
    Active: 'Активен',
    'On Hold': 'В паузе',
    Completed: 'Завершен'
  };

  const ageLabels: Record<string, string> = {
    All: 'Все возраста',
    Kids: 'Дети',
    Teens: 'Подростки',
    Adults: 'Взрослые'
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
      <View className="flex-row flex-wrap gap-6 lg:flex-nowrap w-full">
      
      {/* LEFT: Students list register (3/5ths width on desktop) */}
      <View className="flex-1 min-w-[340px] bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col">
        <Text className="text-xl font-bold text-slate-800 mb-2">Реестр студентов</Text>
        <Text className="text-xs text-slate-400 mb-6">Отслеживание уровня знаний, истории оплат и баланса учебных часов.</Text>

        {/* Filters and search box */}
        <View className="space-y-4 mb-6">
          <View className="relative bg-slate-50 border border-slate-200 rounded-lg flex-row items-center px-4">
            <Search size={16} color="#94a3b8" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Поиск по имени, email, телефону..."
              className="flex-grow p-3 text-slate-700 text-sm focus:outline-none"
            />
          </View>

          {/* Filters tag slider */}
          <View className="flex-row items-center justify-between flex-wrap gap-3">
            <View className="flex-row bg-slate-100 rounded-lg p-1 flex-wrap">
              {(['All', 'Active', 'On Hold', 'Completed'] as const).map((st) => (
                <TouchableOpacity 
                  key={st}
                  onPress={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-md ${filterStatus === st ? 'bg-indigo-600' : 'bg-slate-100'}`}
                >
                  <Text className={`text-xs font-semibold ${filterStatus === st ? 'text-white' : 'text-slate-600'}`}>
                    {statusLabels[st]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row bg-slate-100 rounded-lg p-1 flex-wrap">
              {(['All', 'Kids', 'Teens', 'Adults'] as const).map((ag) => (
                <TouchableOpacity 
                  key={ag}
                  onPress={() => setFilterAge(ag)}
                  className={`px-3 py-1.5 rounded-md ${filterAge === ag ? 'bg-slate-800' : 'bg-slate-100'}`}
                >
                  <Text className={`text-xs font-semibold ${filterAge === ag ? 'text-white' : 'text-slate-600'}`}>
                    {ageLabels[ag]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Live List Scroll container */}
        <View className="gap-3 flex-1">
          {filteredStudents.map((student) => (
            <TouchableOpacity 
              key={student.id} 
              onPress={() => { setSelectedStudent(student); setShowDeleteConfirm(false); }}
              className={`p-4 rounded-xl border flex flex-row justify-between items-center transition-all ${
                selectedStudent?.id === student.id
                  ? 'bg-indigo-50/50 border-indigo-400' 
                  : 'bg-slate-50 border-slate-100 hover:bg-slate-100/60'
              }`}
            >
              <View className="flex-row items-center space-x-4 gap-3">
                {/* Initial Level bubble representation */}
                <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
                  <Text className="text-xs font-extrabold text-indigo-700">
                    {student.level || 'A1'}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-bold text-slate-800">{student.name}</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">{student.email}</Text>
                  <View className="flex-row gap-2 mt-1.5 items-center">
                    <Text className={`text-5px rounded-full px-2 py-0.5 text-xs uppercase tracking-wider ${
                      student.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                      student.status === 'On Hold' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {statusLabels[student.status]}
                    </Text>
                    <Text className="text-xs bg-slate-150 text-slate-600 px-2 rounded">
                      {ageLabels[student.ageGroup]}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="text-right items-end">
                <Text className={`text-sm font-black ${student.balance > 0 ? "text-slate-900" : "text-rose-600"}`}>
                  {student.balance} ч. осталось
                </Text>
                <Text className="text-xs text-slate-400 mt-1">
                  Оплачено: ${student.totalPaid}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {filteredStudents.length === 0 && (
            <View className="py-12 items-center">
              <Text className="text-slate-400 text-sm">Студентов с такими критериями не найдено.</Text>
            </View>
          )}
        </View>
      </View>

      {/* RIGHT: Detail View / CRM Actions Panel */}
      <View className="w-full lg:w-96 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
        {selectedStudent ? (
          <View className="flex-1 flex justify-between">
            {/* Upper details block */}
            <View>
              <View className="flex-row justify-between items-start mb-6">
                <View>
                  <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">Профиль студента</Text>
                  <Text className="text-xl font-bold text-slate-900 mt-1">{selectedStudent.name}</Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={() => handleOpenEdit(selectedStudent)} className="bg-slate-100 hover:bg-slate-200 p-2.5 rounded-lg border border-slate-200" title="Редактировать">
                    <Edit size={16} color="#475569" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowDeleteConfirm(true)} className="bg-rose-50 hover:bg-rose-100 p-2.5 rounded-lg border border-rose-100" title="Удалить">
                    <Trash2 size={16} color="#e11d48" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* CRM student details specs */}
              <View className="space-y-4 mb-6">
                <View className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Языковые данные</Text>
                  <View className="flex flex-row justify-between mb-2">
                    <Text className="text-sm text-slate-600">Текущий уровень CEFR:</Text>
                    <Text className="text-sm font-bold text-indigo-700">{selectedStudent.level}</Text>
                  </View>
                  <View className="flex flex-row justify-between mb-2">
                    <Text className="text-sm text-slate-600">Оплачено учебных часов:</Text>
                    <Text className={`text-sm font-bold ${selectedStudent.balance > 0 ? "text-emerald-700" : "text-rose-600"}`}>
                      {selectedStudent.balance} ч. занятий
                    </Text>
                  </View>
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm text-slate-600">Номер телефона:</Text>
                    <Text className="text-sm text-slate-800">{selectedStudent.phone}</Text>
                  </View>
                </View>

                {/* Buy Hour package button */}
                <TouchableOpacity 
                  onPress={() => setBuyHoursModal(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 p-3 rounded-lg flex-row justify-center items-center gap-2 shadow"
                >
                  <ShoppingCart size={16} color="#ffffff" />
                  <Text className="text-white text-xs font-bold">Оплатить пакет часов</Text>
                </TouchableOpacity>

                {/* Quick Status / Delete Actions Container */}
                <View className="gap-2.5">
                  <Text className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Управление статусом и профилем</Text>
                  
                  <View className="flex-row gap-2">
                    {selectedStudent.status !== 'Completed' ? (
                      <TouchableOpacity 
                        onPress={() => {
                          const updated = { ...selectedStudent, status: 'Completed' as const };
                          dispatch(updateStudent(updated));
                          setSelectedStudent(updated);
                        }}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 p-2.5 rounded-lg flex-row justify-center items-center gap-2 shadow-sm"
                      >
                        <Award size={14} color="#ffffff" />
                        <Text className="text-white text-xs font-bold text-center">Сделать бывшим</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        onPress={() => {
                          const updated = { ...selectedStudent, status: 'Active' as const };
                          dispatch(updateStudent(updated));
                          setSelectedStudent(updated);
                        }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 p-2.5 rounded-lg flex-row justify-center items-center gap-2 shadow-sm"
                      >
                        <UserCheck size={14} color="#ffffff" />
                        <Text className="text-white text-xs font-bold text-center font-bold">Сделать активным</Text>
                      </TouchableOpacity>
                    )}

                    {!showDeleteConfirm && (
                      <TouchableOpacity 
                        onPress={() => setShowDeleteConfirm(true)}
                        className="flex-1 border border-rose-200 bg-rose-50 hover:bg-rose-100 p-2.5 rounded-lg flex-row justify-center items-center gap-1.5"
                      >
                        <Trash2 size={14} color="#e11d48" />
                        <Text className="text-rose-700 text-xs font-bold text-center">Удалить профиль</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {showDeleteConfirm && (
                    <View className="bg-rose-50 border border-rose-200 p-3 rounded-xl gap-2 mt-1">
                      <Text className="text-xs text-rose-800 font-bold">Опасная зона!</Text>
                      <Text className="text-[10px] text-rose-600 leading-relaxed">
                        Вы уверены, что хотите полностью удалить студента "{selectedStudent.name}"? Это действие необратимо и сотрет все данные и баланс часов.
                      </Text>
                      <View className="flex-row gap-2 mt-1">
                        <TouchableOpacity 
                          onPress={() => handleDelete(selectedStudent.id)}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 py-2 rounded-lg items-center shadow-xs"
                        >
                          <Text className="text-white text-[11px] font-black">Да, удалить</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => setShowDeleteConfirm(false)}
                          className="flex-1 bg-white border border-slate-200 py-2 rounded-lg items-center"
                        >
                          <Text className="text-slate-600 text-[11px] font-semibold">Отмена</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                <View className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Комментарии преподавателя</Text>
                  <Text className="text-xs text-slate-600 italic">
                    "{selectedStudent.notes || "Заметок об успеваемости или пожеланиях пока нет."}"
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom aggregate stat */}
            <View className="pt-4 border-t border-slate-100 bg-indigo-50/40 p-3 rounded-lg flex-row justify-between items-center">
              <View>
                <Text className="text-[10px] text-slate-400 uppercase font-semibold">Всего внесено оплат</Text>
                <Text className="text-base font-bold text-indigo-800">${selectedStudent.totalPaid}</Text>
              </View>
              <Award size={20} color="#4f46e5" />
            </View>
          </View>
        ) : (
          <View className="flex-grow justify-center items-center py-20 text-center">
            <AlertCircle size={36} color="#94a3b8" />
            <Text className="text-sm font-bold text-slate-600 mt-4 text-center">Студент не выбран</Text>
            <Text className="text-xs text-slate-400 mt-1.5 text-center">Выберите студента в списке слева для просмотра его деталей, изменения баланса часов, уровня знаний и добавления заметок.</Text>
          </View>
        )}
      </View>
      </View>

      {/* EDIT STUDENT MODAL */}
      <Modal animationType="slide" transparent={true} visible={editModal} onRequestClose={() => setEditModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <Text className="text-lg font-bold text-slate-900 mb-4">Редактировать профиль студента</Text>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">ФИО студента</Text>
                <TextInput value={editName} onChangeText={setEditName} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800" />
              </View>

              <View className="grid grid-cols-2 gap-4">
                <View>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Email</Text>
                  <TextInput value={editEmail} onChangeText={setEditEmail} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800" />
                </View>
                <View>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Телефон</Text>
                  <TextInput value={editPhone} onChangeText={setEditPhone} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800" />
                </View>
              </View>

              <View className="grid grid-cols-2 gap-4">
                <View>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Уровень по CEFR</Text>
                  <TextInput value={editLevel} onChangeText={setEditLevel} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800" />
                </View>

                <View>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Статус обучения</Text>
                  <View className="flex flex-row bg-slate-100 rounded-lg p-1">
                    {(['Active', 'On Hold', 'Completed'] as const).map((st) => (
                      <TouchableOpacity 
                        key={st}
                        onPress={() => setEditStatus(st)}
                        className={`flex-1 items-center py-1.5 rounded-md ${editStatus === st ? 'bg-white shadow' : ''}`}
                      >
                        <Text className="text-xs font-bold text-slate-800">{statusLabels[st]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Заметки и пожелания</Text>
                <TextInput 
                  value={editNotes} 
                  onChangeText={setEditNotes} 
                  multiline 
                  numberOfLines={3} 
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 text-xs min-h-[80px]" 
                />
              </View>
            </View>

            <View className="flex-row justify-end space-x-3 mt-6">
              <TouchableOpacity onPress={() => setEditModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-200">
                <Text className="text-xs font-semibold text-slate-500">Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit} className="px-5 py-2.5 bg-indigo-600 rounded-lg">
                <Text className="text-xs font-bold text-white">Сохранить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BUY HOURS MODULE MODAL */}
      <Modal animationType="slide" transparent={true} visible={buyHoursModal} onRequestClose={() => setBuyHoursModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl text-center items-center">
            <ShoppingCart size={32} color="#10b981" className="mb-2" />
            <Text className="text-lg font-bold text-slate-900">Пополнить баланс учебных часов</Text>
            <Text className="text-xs text-slate-400 mt-1 mb-6">Стоимость занятий рассчитывается исходя из $25 за академический час.</Text>

            <View className="w-full space-y-4 mb-6">
              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Количество добавляемых часов</Text>
                <TextInput 
                  value={buyHoursAmount} 
                  onChangeText={setBuyHoursAmount} 
                  keyboardType="numeric" 
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 text-center text-lg font-bold" 
                />
              </View>

              <View className="bg-slate-50 p-3 rounded-lg border border-slate-100 items-center justify-between flex-row">
                <Text className="text-xs text-slate-600">Стоимость к списанию:</Text>
                <Text className="text-base font-extrabold text-slate-800">
                  ${(parseInt(buyHoursAmount, 10) || 0) * 25}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-end w-full space-x-3">
              <TouchableOpacity onPress={() => setBuyHoursModal(false)} className="flex-1 py-2.5 rounded-lg border border-slate-200 items-center">
                <Text className="text-xs font-semibold text-slate-500">Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBuyHours} className="flex-1 py-2.5 bg-emerald-600 rounded-lg items-center">
                <Text className="text-xs font-bold text-white">Купить и зачислить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}
