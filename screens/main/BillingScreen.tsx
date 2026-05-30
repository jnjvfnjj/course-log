import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, addTransaction } from '../../store';
import { DollarSign, ArrowUpRight, ArrowDownRight, Plus, RefreshCw, AlertCircle, Calendar } from 'lucide-react-native';

export default function BillingScreen() {
  const dispatch = useDispatch();
  const transactions = useSelector((state: RootState) => state.billing.transactions);
  const students = useSelector((state: RootState) => state.students.list);

  // States
  const [modalOpen, setModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');

  // Form states
  const [amount, setAmount] = useState('150');
  const [type, setType] = useState<'Income' | 'Expense'>('Income');
  const [category, setCategory] = useState<'Tuition' | 'Salary' | 'Materials' | 'Rent' | 'Other'>('Tuition');
  const [studentId, setStudentId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('2026-05-28');

  // Filter transactions to only active existing records in database
  const activeTransactions = transactions.filter(t => !t.studentId || students.some(s => s.id === t.studentId));

  // Financial aggregates
  const incomeTrans = activeTransactions.filter(t => t.type === 'Income');
  const expenseTrans = activeTransactions.filter(t => t.type === 'Expense');

  const totalIncome = incomeTrans.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTrans.reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const filteredTrans = activeTransactions.filter(t => filterType === 'All' || t.type === filterType);

  const handleAddTransaction = () => {
    if (!amount || !description) return;
    const amtNum = parseFloat(amount) || 0;
    if (amtNum <= 0) return;

    let selectedStdName = '';
    if (type === 'Income' && studentId) {
      const s = students.find(item => item.id === studentId);
      if (s) selectedStdName = s.name;
    }

    dispatch(addTransaction({
      studentId: type === 'Income' && studentId ? studentId : undefined,
      studentName: selectedStdName || undefined,
      amount: amtNum,
      type,
      category,
      date,
      description
    }));

    // If tuition, increment student hours
    if (type === 'Income' && studentId) {
      const index = students.findIndex(s => s.id === studentId);
      if (index !== -1) {
        const student = students[index];
        const hoursBought = Math.floor(amtNum / 25);
        if (hoursBought > 0) {
          dispatch({
            type: 'students/updateStudent',
            payload: {
              ...student,
              balance: student.balance + hoursBought,
              totalPaid: student.totalPaid + amtNum,
              totalClasses: student.totalClasses + hoursBought
            }
          });
        }
      }
    }

    setAmount('150');
    setDescription('');
    setStudentId('');
    setModalOpen(false);
  };

  const filterTypeLabels: Record<string, string> = {
    All: 'Все операции',
    Income: 'Доходы',
    Expense: 'Расходы'
  };

  const categoryLabels: Record<string, string> = {
    Tuition: 'Обучение',
    Salary: 'Зарплата',
    Materials: 'Материалы',
    Rent: 'Аренда',
    Other: 'Другое'
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
      <View className="flex-row flex-wrap gap-6 lg:flex-nowrap w-full">
      
      {/* LEFT ASPECT: Ledger timeline (3/5ths wide) */}
      <View className="flex-1 min-w-[340px] bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col">
        <View className="flex flex-row justify-between items-center mb-6 flex-wrap gap-4">
          <View>
            <Text className="text-xl font-bold text-slate-800">Финансовый журнал</Text>
            <Text className="text-xs text-slate-400 mt-1">История доходов школы от абонементов и расходов на выплату зарплат преподавателям.</Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
              setModalOpen(true);
              if (students.length > 0) setStudentId(students[0].id);
            }}
            className="bg-indigo-600 hover:bg-slate-900 px-4 py-2 rounded-lg flex-row items-center gap-2 shadow"
          >
            <Plus size={16} color="#ffffff" />
            <Text className="text-white text-xs font-bold">Внести запись</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Filters */}
        <View className="flex-row bg-slate-100 rounded-lg p-1 mb-6 max-w-xs">
          {(['All', 'Income', 'Expense'] as const).map((t) => (
            <TouchableOpacity 
              key={t}
              onPress={() => setFilterType(t)}
              className={`flex-1 py-1.5 items-center rounded-md ${filterType === t ? 'bg-white shadow' : ''}`}
            >
              <Text className={`text-xs font-bold ${filterType === t ? 'text-indigo-600' : 'text-slate-600'}`}>
                {filterTypeLabels[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List ledger scroll */}
        <View className="gap-4 flex-1">
          {filteredTrans.map((tx) => (
            <View 
              key={tx.id}
              className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex-row justify-between items-center"
            >
              <View className="flex flex-row items-center gap-4">
                {/* Income or expense circular display indicator */}
                <View className={`p-2 rounded-full ${tx.type === 'Income' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  {tx.type === 'Income' ? <ArrowUpRight size={18} color="#10b981" /> : <ArrowDownRight size={18} color="#f43f5e" />}
                </View>

                <View>
                  <Text className="text-sm font-extrabold text-slate-800">{tx.description}</Text>
                  {tx.studentName && (
                    <Text className="text-xs text-indigo-600 font-bold mt-0.5">Студент: {tx.studentName}</Text>
                  )}
                  <Text className="text-xs text-slate-400 mt-1">Категория: {categoryLabels[tx.category] || tx.category}</Text>
                </View>
              </View>

              <View className="text-right items-end">
                <Text className={`text-sm font-black ${tx.type === 'Income' ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {tx.type === 'Income' ? '+' : '-'}${tx.amount}
                </Text>
                <Text className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wider">
                  {tx.date}
                </Text>
              </View>
            </View>
          ))}

          {filteredTrans.length === 0 && (
            <View className="py-20 items-center justify-center">
              <DollarSign size={32} color="#cbd5e1" className="mb-2" />
              <Text className="text-slate-400 text-sm">Операций по выбранному фильтру не найдено.</Text>
            </View>
          )}
        </View>
      </View>

      {/* RIGHT PANEL: Balance calculation indicators */}
      <View className="w-full lg:w-96 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
        <View className="space-y-6">
          <Text className="text-lg font-bold text-slate-800">Финансовая аналитика</Text>
          <Text className="text-xs text-slate-500">Live-обзор текущего операционного баланса и рентабельности школы.</Text>

          {/* Metric cards right sidebar panel */}
          <View className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-4">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-xs text-slate-400 uppercase font-semibold">Валовая выручка (доходы)</Text>
                <Text className="text-lg font-black text-emerald-600 mt-1">${totalIncome}</Text>
              </View>
              <ArrowUpRight size={24} color="#10b981" />
            </View>

            <View className="border-t border-slate-205 flex-row justify-between items-center pt-3">
              <View>
                <Text className="text-xs text-slate-400 uppercase font-semibold">Общие расходы</Text>
                <Text className="text-lg font-black text-rose-600 mt-1">${totalExpense}</Text>
              </View>
              <ArrowDownRight size={24} color="#f43f5e" />
            </View>
          </View>

          <View className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex-row justify-between items-center">
            <View>
              <Text className="text-xs text-indigo-700 uppercase font-bold">Чистая прибыль школы</Text>
              <Text className={`text-2xl font-black mt-1 ${netProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                ${netProfit}
              </Text>
            </View>
            <DollarSign size={28} color="#4f46e5" />
          </View>
        </View>

        <View className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-center items-center mt-6">
          <AlertCircle size={24} color="#6366f1" className="mb-1" />
          <Text className="text-xs text-slate-500 font-bold mb-1">Тарифная модель по умолчанию</Text>
          <Text className="text-[10px] text-slate-400 text-center">Стоимость учебного часа составляет $25 USD. Внесение средств автоматически увеличивает оставшиеся оплаченные часы на балансе выбранного студента.</Text>
        </View>
      </View>
      </View>

      {/* MODAL FOR NEW TRANSACTION */}
      <Modal animationType="slide" transparent={true} visible={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <Text className="text-lg font-bold text-slate-900 mb-4 font-bold">Провести финансовую операцию</Text>

            <View className="space-y-4">
              <View className="flex-row bg-slate-100 rounded-lg p-1 mb-2">
                {(['Income', 'Expense'] as const).map((t) => (
                  <TouchableOpacity 
                    key={t}
                    onPress={() => {
                      setType(t);
                      if (t === 'Expense') {
                        setCategory('Salary');
                      } else {
                        setCategory('Tuition');
                      }
                    }}
                    className={`flex-1 py-1.5 items-center rounded-md ${type === t ? 'bg-white shadow' : ''}`}
                  >
                    <Text className={`text-xs font-bold ${type === t ? 'text-indigo-600 font-semibold' : 'text-slate-600'}`}>
                      {t === 'Income' ? 'Приход (Доход)' : 'Расход'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="grid grid-cols-2 gap-4">
                <View>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Сумма ($ USD)</Text>
                  <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="150" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 text-sm font-bold" />
                </View>

                <View>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Категория учета</Text>
                  <View className="bg-slate-50 border border-slate-200 rounded-lg p-1">
                    <TextInput value={category} onChangeText={(v: any) => setCategory(v)} placeholder="Tuition" className="p-2 text-slate-800 text-sm" />
                  </View>
                </View>
              </View>

              {type === 'Income' && (
                <View>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">Студент-плательщик (зачисление баланса)</Text>
                  <View className="bg-slate-50 rounded-lg p-2.5 flex-row flex-wrap gap-1 border border-slate-200">
                    {students.map((st) => (
                      <TouchableOpacity 
                        key={st.id}
                        onPress={() => setStudentId(st.id)}
                        className={`px-3 py-1.5 rounded-md ${studentId === st.id ? 'bg-indigo-600' : 'bg-slate-200'}`}
                      >
                        <Text className={`text-xs ${studentId === st.id ? 'text-white font-bold' : 'text-slate-700'}`}>{st.name}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity 
                      onPress={() => setStudentId('')} 
                      className={`px-3 py-1.5 rounded-md ${!studentId ? 'bg-slate-400' : 'bg-slate-200'}`}
                    >
                      <Text className={`text-xs ${!studentId ? 'text-white font-bold' : 'text-slate-700'}`}>Без студента (общий приход)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Описание назначения платежа</Text>
                <TextInput value={description} onChangeText={setDescription} placeholder="Например: Покупка пакета 10 занятий / Выплата Елене за май" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 text-sm" />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Дата транзакции</Text>
                <TextInput value={date} onChangeText={setDate} placeholder="2026-05-28" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 text-sm" />
              </View>
            </View>

            <View className="flex-row justify-end space-x-3 mt-6">
              <TouchableOpacity onPress={() => setModalOpen(false)} className="px-4 py-2.5 rounded-lg border border-slate-200">
                <Text className="text-xs font-semibold text-slate-400">Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddTransaction} className="px-5 py-2.5 bg-indigo-600 rounded-lg">
                <Text className="text-xs font-bold text-white">Провести</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}
