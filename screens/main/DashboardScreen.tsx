import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, addStudent, addLesson, addTransaction } from '../../store';
import { Users, GraduationCap, Calendar, DollarSign, Plus, ArrowUpRight, TrendingUp } from 'lucide-react-native';

export default function DashboardScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const students = useSelector((state: RootState) => state.students.list);
  const lessons = useSelector((state: RootState) => state.lessons.list);
  const transactions = useSelector((state: RootState) => state.billing.transactions);
  const userRole = useSelector((state: RootState) => state.auth.user?.role);

  // Quick states for quick action modala
  const [modalType, setModalType] = useState<'student' | 'lesson' | 'payment' | null>(null);

  // Selector state for level groups
  const [selectedLevelGroup, setSelectedLevelGroup] = useState<string | null>('B1');

  // Form states
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentLevel, setStudentLevel] = useState('Intermediate (B1)');
  const [studentAge, setStudentAge] = useState<'Kids' | 'Teens' | 'Adults'>('Adults');
  const [studentBalance, setStudentBalance] = useState('10');

  const [lessonStudentId, setLessonStudentId] = useState('');
  const [lessonDate, setLessonDate] = useState('2026-05-28');
  const [lessonTime, setLessonTime] = useState('12:00');
  const [lessonTeacher, setLessonTeacher] = useState('Елена Смирнова');
  const [lessonTopic, setLessonTopic] = useState('');

  const [paymentStudentId, setPaymentStudentId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('150');
  const [paymentDesc, setPaymentDesc] = useState('Покупка пакета занятий');

  // Stats calculations
  const activeStudents = students.filter(s => s.status === 'Active').length;
  const activeLessons = lessons.filter(l => students.some(s => s.id === l.studentId));
  const activeTransactions = transactions.filter(t => !t.studentId || students.some(s => s.id === t.studentId));

  const pendingLessons = activeLessons.filter(l => l.status === 'Scheduled').length;
  
  const totalIncome = activeTransactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = activeTransactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const profitLoss = totalIncome - totalExpense;

  const handleAddStudent = () => {
    if (!studentName || !studentEmail) return;
    dispatch(addStudent({
      name: studentName,
      email: studentEmail,
      phone: studentPhone || '+79998881111',
      level: studentLevel,
      ageGroup: studentAge,
      balance: parseInt(studentBalance, 10) || 0,
      status: 'Active',
      notes: 'Быстрая регистрация через панель управления'
    }));

    // Create a transaction record too
    const bal = parseInt(studentBalance, 10) || 0;
    if (bal > 0) {
      dispatch(addTransaction({
        studentName: studentName,
        amount: bal * 25,
        type: 'Income',
        category: 'Tuition',
        date: new Date().toISOString().split('T')[0],
        description: `Зарегистрирован студент ${studentName} со стартовым пакетом из ${bal} часов`
      }));
    }

    setStudentName('');
    setStudentEmail('');
    setStudentPhone('');
    setStudentBalance('10');
    setModalType(null);
  };

  const handleAddLesson = () => {
    if (!lessonStudentId || !lessonTopic) return;
    const selectedStd = students.find(s => s.id === lessonStudentId);
    if (!selectedStd) return;

    dispatch(addLesson({
      studentId: lessonStudentId,
      studentName: selectedStd.name,
      date: lessonDate,
      time: lessonTime,
      teacherName: lessonTeacher,
      topic: lessonTopic,
      duration: 1,
      status: 'Scheduled'
    }));

    setLessonTopic('');
    setModalType(null);
  };

  const handleAddPayment = () => {
    if (!paymentStudentId || !paymentAmount) return;
    const selectedStd = students.find(s => s.id === paymentStudentId);
    if (!selectedStd) return;

    const amt = parseFloat(paymentAmount) || 0;
    dispatch(addTransaction({
      studentId: paymentStudentId,
      studentName: selectedStd.name,
      amount: amt,
      type: 'Income',
      category: 'Tuition',
      date: new Date().toISOString().split('T')[0],
      description: paymentDesc || 'Оплата за обучение'
    }));

    // Reward active balance on CRM (each $25 is 1 hour of instruction)
    const hours = Math.floor(amt / 25);
    if (hours > 0) {
      const idx = students.findIndex(s => s.id === paymentStudentId);
      if (idx !== -1) {
        dispatch({
          type: 'students/updateStudent',
          payload: {
            ...students[idx],
            balance: students[idx].balance + hours,
            totalPaid: students[idx].totalPaid + amt,
            totalClasses: students[idx].totalClasses + hours
          }
        });
      }
    }

    setPaymentAmount('150');
    setPaymentDesc('Покупка пакета занятий');
    setModalType(null);
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 24, flexGrow: 1, paddingBottom: 60 }}>
      
      {/* Header section */}
      <View className="mb-8 flex-row justify-between items-center flex-wrap">
        <View className="mb-2">
          <Text className="text-2xl font-bold text-slate-900">Обзор успеваемости</Text>
          <Text className="text-sm text-slate-500 mt-1">
            Вы вошли как: <Text className="font-semibold text-indigo-600">{userRole === 'Admin' ? 'Администратор' : 'Преподаватель'}</Text>
          </Text>
        </View>

        {/* Quick action triggers */}
        <View className="flex-row gap-3">
          <TouchableOpacity 
            onPress={() => {
              setModalType('student');
            }}
            className="bg-indigo-600 hover:bg-slate-900 px-4 py-2.5 rounded-lg flex-row items-center gap-2 shadow"
          >
            <Plus size={16} color="#ffffff" />
            <Text className="text-white text-xs font-semibold">Новый студент</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              setModalType('lesson');
              if (students.length > 0) setLessonStudentId(students[0].id);
            }}
            className="bg-slate-800 hover:bg-indigo-600 px-4 py-2.5 rounded-lg flex-row items-center gap-2 shadow"
          >
            <Calendar size={16} color="#ffffff" />
            <Text className="text-white text-xs font-semibold">Назначить урок</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid of four stat widgets */}
      <View className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        {/* Stat item 1 */}
        <View className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Активные студенты</Text>
            <Text className="text-3xl font-extrabold text-slate-900 mt-2">{activeStudents}</Text>
            <View className="flex-row items-center mt-2.5">
              <TrendingUp size={14} color="#10b981" />
              <Text className="text-xs font-medium text-emerald-600 ml-1">Постоянный рост</Text>
            </View>
          </View>
          <View className="bg-indigo-50 p-3 rounded-xl">
            <Users size={24} color="#6366f1" />
          </View>
        </View>

        {/* Stat item 2 */}
        <View className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Запланировано уроков</Text>
            <Text className="text-3xl font-extrabold text-slate-900 mt-2">{pendingLessons}</Text>
            <View className="flex-row items-center mt-2.5">
              <Calendar size={14} color="#6366f1" />
              <Text className="text-xs font-medium text-indigo-600 ml-1">На эту неделю</Text>
            </View>
          </View>
          <View className="bg-indigo-50 p-3 rounded-xl">
            <GraduationCap size={24} color="#6366f1" />
          </View>
        </View>

        {/* Stat item 3 */}
        <View className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Общая выручка</Text>
            <Text className="text-3xl font-extrabold text-slate-900 mt-2">${totalIncome.toLocaleString()}</Text>
            <View className="flex-row items-center mt-2.5">
              <Plus size={14} color="#10b981" />
              <Text className="text-xs font-medium text-emerald-600 ml-1">Оплаты обучения</Text>
            </View>
          </View>
          <View className="bg-emerald-50 p-3 rounded-xl">
            <DollarSign size={24} color="#10b981" />
          </View>
        </View>

        {/* Stat item 4 */}
        <View className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Чистый баланс</Text>
            <Text className={`text-3xl font-extrabold mt-2 ${profitLoss >= 0 ? "text-slate-900" : "text-rose-600"}`}>
              ${profitLoss.toLocaleString()}
            </Text>
            <View className="flex-row items-center mt-2.5">
              <ArrowUpRight size={14} color="#64748b" />
              <Text className="text-xs font-medium text-slate-500 ml-1">Маржинальность</Text>
            </View>
          </View>
          <View className={`p-3 rounded-xl ${profitLoss >= 0 ? "bg-slate-100" : "bg-rose-50"}`}>
            <TrendingUp size={24} color={profitLoss >= 0 ? "#475569" : "#e11d48"} />
          </View>
        </View>

      </View>

      {/* ГРУППЫ ОБУЧЕНИЯ (Кнопки и списки студентов) */}
      <View className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
        <View className="mb-4">
          <Text className="text-lg font-bold text-slate-800">Учебные группы (CEFR)</Text>
          <Text className="text-xs text-slate-400 mt-1">Выберите необходимую языковую группу, чтобы посмотреть список закрепленных за ней активных студентов и их баланс учебных часов:</Text>
        </View>

        <View className="flex-row flex-wrap gap-4 mb-6">
          {[
            { key: 'A1', title: 'Группа A1', desc: 'Начальный (Beginner)', color: 'border-indigo-400 bg-indigo-50 text-indigo-700', activeText: 'text-indigo-800' },
            { key: 'A2', title: 'Группа A2', desc: 'Базовый (Elementary)', color: 'border-cyan-400 bg-cyan-50 text-cyan-700', activeText: 'text-cyan-800' },
            { key: 'B1', title: 'Группа B1', desc: 'Средний (Intermediate)', color: 'border-emerald-400 bg-emerald-50 text-emerald-700', activeText: 'text-emerald-800' },
            { key: 'B2', title: 'Группа B2', desc: 'Выше среднего (Upper-Int)', color: 'border-amber-400 bg-amber-50 text-amber-700', activeText: 'text-amber-800' },
            { key: 'C1', title: 'Группа C1', desc: 'Продвинутый (Advanced)', color: 'border-rose-400 bg-rose-50 text-rose-700', activeText: 'text-rose-800' },
          ].map((item) => {
            const matchStudentLevel = (studentLevel: string, groupKey: string) => {
              if (!studentLevel) return false;
              const normalizedGroup = groupKey.toUpperCase();
              const normalizedLevel = studentLevel.toUpperCase();
              return normalizedLevel === normalizedGroup || normalizedLevel.includes(`(${normalizedGroup})`) || normalizedLevel.includes(normalizedGroup);
            };

            const count = students.filter(s => matchStudentLevel(s.level, item.key)).length;
            const isSelected = selectedLevelGroup === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setSelectedLevelGroup(item.key)}
                className={`p-4 rounded-xl border flex-1 min-w-[180px] transition-all flex flex-row items-center justify-between ${
                  isSelected ? `${item.color} border-2 shadow-sm` : 'bg-slate-50 border-slate-150 hover:bg-slate-100/60'
                }`}
              >
                <View>
                  <Text className={`font-bold text-sm ${isSelected ? item.activeText : 'text-slate-700'}`}>{item.title}</Text>
                  <Text className="text-slate-500 text-[10px] mt-0.5">{item.desc}</Text>
                </View>
                <View className={`w-7 h-7 rounded-full items-center justify-center ${isSelected ? 'bg-white shadow' : 'bg-slate-200'}`}>
                  <Text className="text-xs font-bold text-slate-800">{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedLevelGroup && (
          <View className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Список студентов группы {selectedLevelGroup} – {
                selectedLevelGroup === 'A1' ? 'Beginner' :
                selectedLevelGroup === 'A2' ? 'Elementary' :
                selectedLevelGroup === 'B1' ? 'Intermediate' :
                selectedLevelGroup === 'B2' ? 'Upper-Intermediate' : 'Advanced (C1)'
              }
            </Text>

            <View className="gap-2">
              {students.filter(s => {
                if (!s.level) return false;
                const normalizedGroup = selectedLevelGroup.toUpperCase();
                const normalizedLevel = s.level.toUpperCase();
                return normalizedLevel === normalizedGroup || normalizedLevel.includes(`(${normalizedGroup})`) || normalizedLevel.includes(normalizedGroup);
              }).map((student) => (
                <View
                  key={student.id}
                  className="bg-white p-3 rounded-lg border border-slate-200 flex flex-row justify-between items-center hover:bg-slate-50/50"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
                      <Text className="text-xs font-bold text-indigo-650">
                        {selectedLevelGroup}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-slate-800">{student.name}</Text>
                      <Text className="text-[10px] text-slate-400 mt-0.5">{student.email} • {student.phone}</Text>
                    </View>
                  </View>

                  <View className="flex flex-row items-center gap-3">
                    <Text className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      student.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                      student.status === 'On Hold' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {student.status === 'Active' ? 'Активен' : student.status === 'On Hold' ? 'В паузе' : 'Завершен'}
                    </Text>
                    <Text className={`text-xs font-extrabold ${student.balance > 0 ? "text-slate-800" : "text-rose-600"}`}>
                      {student.balance} ч.
                    </Text>
                  </View>
                </View>
              ))}

              {students.filter(s => {
                if (!s.level) return false;
                const normalizedGroup = selectedLevelGroup.toUpperCase();
                const normalizedLevel = s.level.toUpperCase();
                return normalizedLevel === normalizedGroup || normalizedLevel.includes(`(${normalizedGroup})`) || normalizedLevel.includes(normalizedGroup);
              }).length === 0 && (
                <Text className="text-xs text-slate-400 italic py-4 text-center">В этой возрастной группе пока нет студентов.</Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Main Bottom Section: Layout schedule and quick financial logs side-by-side */}
      <View className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Schedule (2 columns width) */}
        <View className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <View className="flex flex-row justify-between items-center mb-5 pb-3 border-b border-slate-100">
            <View>
              <Text className="text-lg font-bold text-slate-800">Расписание занятий</Text>
              <Text className="text-xs text-slate-500 mt-0.5">Ближайшие запланированные и завершенные уроки</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
              <Text className="text-indigo-600 font-semibold text-xs py-1 px-3 bg-indigo-50 hover:bg-indigo-100 rounded">
                Календарь →
              </Text>
            </TouchableOpacity>
          </View>

          {/* List today's lessons */}
          <View className="space-y-4">
            {activeLessons.slice(0, 4).map((lesson) => (
              <View 
                key={lesson.id} 
                className="flex flex-row items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 hover:bg-slate-100/50"
              >
                <View className="flex-row items-center gap-4">
                  {/* Status Indicator */}
                  <View className={`w-2.5 h-12 rounded-full ${
                    lesson.status === 'Completed' ? 'bg-emerald-500' :
                    lesson.status === 'Cancelled' ? 'bg-rose-400' : 'bg-amber-400'
                  }`} />
                  <View>
                    <Text className="text-sm font-bold text-slate-800">{lesson.studentName}</Text>
                    <Text className="text-xs text-indigo-600 font-medium mt-0.5">Тема: {lesson.topic}</Text>
                    <Text className="text-xs text-slate-500 mt-1">Преподаватель: {lesson.teacherName}</Text>
                  </View>
                </View>

                <View className="text-right items-end">
                  <Text className="text-xs font-bold text-slate-900 bg-slate-200 px-2.5 py-1 rounded">
                    {lesson.time}
                  </Text>
                  <Text className="text-6px font-semibold text-slate-400 uppercase mt-1.5 tracking-wider">
                    {lesson.date}
                  </Text>
                </View>
              </View>
            ))}

            {activeLessons.length === 0 && (
              <View className="py-12 items-center">
                <Text className="text-slate-400 text-sm">Уроков не найдено. Назначьте обучающие часы для старта.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Sidebar Panel: Shortcuts & Quick stats */}
        <View className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <View>
            <Text className="text-lg font-bold text-slate-800 mb-2">Быстрый доступ к CRM</Text>
            <Text className="text-xs text-slate-500 mb-6">Принимайте оплаты или отслеживайте прогресс студентов.</Text>

            {/* List short cuts trigger modal */}
            <TouchableOpacity 
              onPress={() => {
                setModalType('payment');
                if (students.length > 0) setPaymentStudentId(students[0].id);
              }}
              className="mb-4 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100/60 p-4 rounded-xl flex-row items-center"
            >
              <View className="bg-emerald-500 p-2.5 rounded-lg mr-4">
                <DollarSign size={18} color="#ffffff" />
              </View>
              <View>
                <Text className="text-sm font-bold text-slate-800">Внести оплату студента</Text>
                <Text className="text-xs text-emerald-700 mt-0.5">Пополняет баланс учебных часов</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.navigate('Students')}
              className="bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/60 p-4 rounded-xl flex-row items-center"
            >
              <View className="bg-indigo-500 p-2.5 rounded-lg mr-4">
                <Users size={18} color="#ffffff" />
              </View>
              <View>
                <Text className="text-sm font-bold text-slate-800">Список и уровни знаний</Text>
                <Text className="text-xs text-indigo-700 mt-0.5">Поиск, фильтр и уровни CEFR</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View className="pt-6 border-t border-slate-100">
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Статус системы</Text>
            <View className="flex-row items-center justify-between text-xs text-slate-600 mb-1">
              <Text>База данных</Text>
              <Text className="text-emerald-600 font-bold">● Подключено</Text>
            </View>
            <View className="flex-row items-center justify-between text-xs text-slate-600">
              <Text>Синхронизация данных</Text>
              <Text className="text-indigo-600 font-bold">Локальная реактивная</Text>
            </View>
          </View>

        </View>

      </View>

      {/* MODAL FOR NEW STUDENT */}
      <Modal animationType="slide" transparent={true} visible={modalType === 'student'} onRequestClose={() => setModalType(null)}>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <Text className="text-lg font-bold text-slate-900 mb-4">Добавить студента в базу</Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">ФИО студента</Text>
                <TextInput value={studentName} onChangeText={setStudentName} placeholder="Иван Иванов" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800" />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Электронная почта</Text>
                <TextInput value={studentEmail} onChangeText={setStudentEmail} keyboardType="email-address" placeholder="ivan@example.com" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800" />
              </View>

              <View className="grid grid-cols-2 gap-4">
                <View>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Телефон</Text>
                  <TextInput value={studentPhone} onChangeText={setStudentPhone} placeholder="+7..." className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800" />
                </View>
                <View>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Стартовый баланс часов</Text>
                  <TextInput value={studentBalance} onChangeText={setStudentBalance} keyboardType="numeric" placeholder="10" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800" />
                </View>
              </View>

              <View className="grid grid-cols-2 gap-4">
                <View>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Уровень по CEFR</Text>
                  <TextInput value={studentLevel} onChangeText={setStudentLevel} placeholder="Intermediate (B1)" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800" />
                </View>
                <View>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Возрастная категория</Text>
                  <View className="flex-row bg-slate-150 rounded-lg p-1">
                    {['Kids', 'Teens', 'Adults'].map((age) => (
                      <TouchableOpacity 
                        key={age} 
                        onPress={() => setStudentAge(age as any)}
                        className={`flex-1 py-1.5 rounded items-center ${studentAge === age ? 'bg-white shadow' : ''}`}
                      >
                        <Text className="text-xs font-bold text-slate-800">
                          {age === 'Kids' ? 'Дети' : age === 'Teens' ? 'Подростки' : 'Взрослые'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            <View className="flex-row justify-end space-x-3 mt-6">
              <TouchableOpacity onPress={() => setModalType(null)} className="px-4 py-2.5 rounded-lg border border-slate-200">
                <Text className="text-xs font-semibold text-slate-500">Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddStudent} className="px-5 py-2.5 bg-indigo-600 rounded-lg">
                <Text className="text-xs font-bold text-white">Сохранить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL FOR NEW LESSON */}
      <Modal animationType="slide" transparent={true} visible={modalType === 'lesson'} onRequestClose={() => setModalType(null)}>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <Text className="text-lg font-bold text-slate-900 mb-4">Запланировать учебное занятие</Text>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Выберите студента</Text>
                <View className="bg-slate-100 rounded-lg p-1 flex-wrap flex-row gap-1">
                  {students.map((s) => (
                    <TouchableOpacity 
                       key={s.id} 
                       onPress={() => setLessonStudentId(s.id)}
                       className={`px-3 py-1.5 rounded-md ${lessonStudentId === s.id ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <Text className={`text-xs ${lessonStudentId === s.id ? 'text-white font-bold' : 'text-slate-700'}`}>{s.name} ({s.balance}ч)</Text>
                    </TouchableOpacity>
                  ))}
                  {students.length === 0 && <Text className="text-xs text-rose-600 p-2">Сначала добавьте студента!</Text>}
                </View>
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Тема занятия / Материалы</Text>
                <TextInput value={lessonTopic} onChangeText={setLessonTopic} placeholder="Например: Разбор Present Continuous и чтение" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800" />
              </View>

              <View className="grid grid-cols-2 gap-4">
                <View>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Дата занятия</Text>
                  <TextInput value={lessonDate} onChangeText={setLessonDate} placeholder="2026-05-28" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800" />
                </View>
                <View>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Время (ЧЧ:ММ)</Text>
                  <TextInput value={lessonTime} onChangeText={setLessonTime} placeholder="12:00" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800" />
                </View>
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Преподаватель</Text>
                <TextInput value={lessonTeacher} onChangeText={setLessonTeacher} placeholder="Елена Смирнова" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800" />
              </View>
            </View>

            <View className="flex-row justify-end space-x-3 mt-6">
              <TouchableOpacity onPress={() => setModalType(null)} className="px-4 py-2.5 rounded-lg border border-slate-200">
                <Text className="text-xs font-semibold text-slate-500">Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddLesson} className="px-5 py-2.5 bg-indigo-600 rounded-lg">
                <Text className="text-xs font-bold text-white">Создать урок</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL FOR NEW PAYMENT */}
      <Modal animationType="slide" transparent={true} visible={modalType === 'payment'} onRequestClose={() => setModalType(null)}>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <Text className="text-lg font-bold text-slate-900 mb-4">Внести платеж / продажу</Text>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Студент</Text>
                <View className="bg-slate-100 rounded-lg p-1 flex-wrap flex-row gap-1">
                  {students.map((s) => (
                    <TouchableOpacity 
                       key={s.id} 
                       onPress={() => setPaymentStudentId(s.id)}
                       className={`px-3 py-1.5 rounded-md ${paymentStudentId === s.id ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <Text className={`text-xs ${paymentStudentId === s.id ? 'text-white font-bold' : 'text-slate-700'}`}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="grid grid-cols-2 gap-4">
                <View>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Сумма ($ USD)</Text>
                  <TextInput value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="numeric" placeholder="150" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800" />
                </View>
                <View className="justify-center pt-4">
                  <Text className="text-xs text-slate-500 font-medium">Авто-зачисление: 1 час за каждые $25</Text>
                </View>
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Описание счёта</Text>
                <TextInput value={paymentDesc} onChangeText={setPaymentDesc} placeholder="Оплачен пакет из 10 занятий" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800" />
              </View>
            </View>

            <View className="flex-row justify-end space-x-3 mt-6">
              <TouchableOpacity onPress={() => setModalType(null)} className="px-4 py-2.5 rounded-lg border border-slate-200">
                <Text className="text-xs font-semibold text-slate-400">Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddPayment} className="px-5 py-2.5 bg-emerald-600 rounded-lg">
                <Text className="text-xs font-bold text-white">Провести</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}
