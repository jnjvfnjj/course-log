import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, addLesson, updateLessonStatus, deleteLesson, adjustBalance } from '../../store';
import { Calendar, Plus, CheckCircle, XCircle, Clock, GraduationCap, Trash2, ArrowLeft } from 'lucide-react-native';

export default function ScheduleScreen() {
  const dispatch = useDispatch();
  const lessons = useSelector((state: RootState) => state.lessons.list);
  const students = useSelector((state: RootState) => state.students.list);

  // States
  const [filter, setFilter] = useState<'All' | 'Scheduled' | 'Completed' | 'Cancelled'>('All');
  const [scheduleModal, setScheduleModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);

  // Form states
  const [studentId, setStudentId] = useState('');
  const [date, setDate] = useState('2026-05-28');
  const [time, setTime] = useState('14:00');
  const [teacher, setTeacher] = useState('Елена Смирнова');
  const [topic, setTopic] = useState('');
  const [lessonNotes, setLessonNotes] = useState('');

  const activeLessons = lessons.filter(l => students.some(s => s.id === l.studentId));
  const filteredLessons = activeLessons.filter(l => filter === 'All' || l.status === filter);

  const handleCreateLesson = () => {
    if (!studentId || !topic) return;
    const selectedStd = students.find(s => s.id === studentId);
    if (!selectedStd) return;

    dispatch(addLesson({
      studentId,
      studentName: selectedStd.name,
      date,
      time,
      teacherName: teacher,
      topic,
      duration: 1,
      status: 'Scheduled',
      notes: ''
    }));

    setTopic('');
    setStudentId('');
    setScheduleModal(false);
  };

  const handleCompleteLesson = (lesson: any) => {
    // Decrease student hours if they are active and balance is above 0
    const student = students.find(s => s.id === lesson.studentId);
    if (student) {
      if (student.balance <= 0) {
        // Warning
        setLessonNotes("Внимание: У студента 0 баланс часов. Отмечено завершенным в долг.");
      }
      // Decrement balance by 1 hour
      dispatch(adjustBalance({ id: student.id, amount: -1 }));
    }

    dispatch(updateLessonStatus({
      id: lesson.id,
      status: 'Completed',
      notes: lessonNotes || 'Завершено вовремя, студент продемонстрировал хорошие успехи.'
    }));

    setDetailModal(false);
    setSelectedLesson(null);
    setLessonNotes('');
  };

  const handleCancelLesson = (lesson: any) => {
    dispatch(updateLessonStatus({
      id: lesson.id,
      status: 'Cancelled',
      notes: 'Отменено по просьбе студента.'
    }));
    setDetailModal(false);
    setSelectedLesson(null);
    setLessonNotes('');
  };

  const handleDelete = (id: string) => {
    dispatch(deleteLesson(id));
    setDetailModal(false);
    setSelectedLesson(null);
  };

  const statusLabels: Record<string, string> = {
    All: 'Все уроки',
    Scheduled: 'Запланировано',
    Completed: 'Проведено',
    Cancelled: 'Отменено'
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
      <View className="flex-row flex-wrap gap-6 lg:flex-nowrap w-full">
      
      {/* LEFTSIDE: Main Daily List scheduler (3/5ths width) */}
      <View className="flex-1 min-w-[340px] bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col">
        <View className="flex flex-row justify-between items-center mb-6 flex-wrap gap-4">
          <View>
            <Text className="text-xl font-bold text-slate-800">Расписание занятий</Text>
            <Text className="text-xs text-slate-400 mt-1">Отслеживание посещаемости и автоматическое списание оплаченного времени.</Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
              setScheduleModal(true);
              if (students.length > 0) setStudentId(students[0].id);
            }}
            className="bg-indigo-600 hover:bg-slate-900 px-4 py-2 rounded-lg flex-row items-center gap-2 shadow"
          >
            <Plus size={16} color="#ffffff" />
            <Text className="text-white text-xs font-bold font-bold">Запланировать урок</Text>
          </TouchableOpacity>
        </View>

        {/* Tab filters */}
        <View className="flex-row bg-slate-100 rounded-lg p-1 mb-6 max-w-md">
          {(['All', 'Scheduled', 'Completed', 'Cancelled'] as const).map((t) => (
            <TouchableOpacity 
              key={t}
              onPress={() => setFilter(t)}
              className={`flex-1 py-1.5 items-center rounded-md ${filter === t ? 'bg-white shadow' : ''}`}
            >
              <Text className={`text-xs font-bold ${filter === t ? 'text-indigo-600' : 'text-slate-600'}`}>
                {statusLabels[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List of lesson scheduling */}
        <View className="gap-4 flex-1">
          {filteredLessons.map((lesson) => (
            <TouchableOpacity 
              key={lesson.id} 
              onPress={() => {
                setSelectedLesson(lesson);
                setLessonNotes(lesson.notes || '');
                setDetailModal(true);
              }}
              className="p-5 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-100 flex-row justify-between items-center transition"
            >
              <View className="flex-row gap-4 items-center">
                {/* Clock / completion representation icons */}
                <View className={`p-2.5 rounded-lg ${
                  lesson.status === 'Completed' ? 'bg-emerald-50' :
                  lesson.status === 'Cancelled' ? 'bg-rose-50' : 'bg-amber-50'
                }`}>
                  {lesson.status === 'Completed' ? <CheckCircle size={20} color="#10b981" /> :
                   lesson.status === 'Cancelled' ? <XCircle size={20} color="#f43f5e" /> :
                   <Clock size={20} color="#f59e0b" />}
                </View>

                <View>
                  <Text className="text-sm font-extrabold text-slate-800">{lesson.studentName}</Text>
                  <Text className="text-xs text-indigo-600 font-bold mt-0.5">Тема: {lesson.topic}</Text>
                  <Text className="text-xs text-slate-400 mt-1">Преподаватель: {lesson.teacherName}</Text>
                </View>
              </View>

              <View className="text-right items-end">
                <Text className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {lesson.time}
                </Text>
                <Text className="text-[10px] uppercase font-bold text-slate-400 mt-1">
                  {lesson.date}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {filteredLessons.length === 0 && (
            <View className="py-20 items-center justify-center">
              <Calendar size={32} color="#cbd5e1" className="mb-2" />
              <Text className="text-slate-400 text-sm">Уроков в этой категории пока нет.</Text>
            </View>
          )}
        </View>
      </View>
      </View>

      {/* DETAIL DRAWER / POPUP ACTION */}
      <Modal animationType="fade" transparent={true} visible={detailModal} onRequestClose={() => setDetailModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/60 p-4">
          <View className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            {selectedLesson && (
              <View>
                <Text className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Информация о посещаемости</Text>
                <Text className="text-xl font-bold text-slate-900 mb-2">{selectedLesson.studentName}</Text>
                <Text className="text-xs text-indigo-600 font-bold mb-6">План темы: {selectedLesson.topic}</Text>

                <View className="bg-slate-50 p-4 rounded-xl space-y-3 mb-6 border border-slate-100">
                  <View className="flex flex-row justify-between text-sm">
                    <Text className="text-slate-500 font-medium">Дата урока:</Text>
                    <Text className="text-slate-800 font-bold">{selectedLesson.date} в {selectedLesson.time}</Text>
                  </View>
                  <View className="flex flex-row justify-between text-sm">
                    <Text className="text-slate-500 font-medium">Закрепленный преподаватель:</Text>
                    <Text className="text-slate-800 font-semibold">{selectedLesson.teacherName}</Text>
                  </View>
                  <View className="flex flex-row justify-between text-sm">
                    <Text className="text-slate-500 font-medium">Статус:</Text>
                    <Text className={`font-bold uppercase text-xs ${
                      selectedLesson.status === 'Completed' ? 'text-emerald-600' :
                      selectedLesson.status === 'Cancelled' ? 'text-rose-600' : 'text-amber-600'
                    }`}>{statusLabels[selectedLesson.status] || selectedLesson.status}</Text>
                  </View>
                </View>

                {selectedLesson.status === 'Scheduled' ? (
                  <View className="space-y-4">
                    <View>
                      <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">Обратная связь от преподавателя (опционально)</Text>
                      <TextInput 
                        value={lessonNotes} 
                        onChangeText={setLessonNotes} 
                        placeholder="Например: Выучили словарный запас, требуется доработка Present Perfect."
                        className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-850 text-xs min-h-[60px]"
                      />
                    </View>

                    {/* Completion actions */}
                    <View className="flex-row gap-3">
                      <TouchableOpacity 
                        onPress={() => handleCancelLesson(selectedLesson)}
                        className="flex-1 py-3 bg-rose-50 border border-rose-200 rounded-lg items-center"
                      >
                        <Text className="text-rose-600 text-xs font-bold">Отменить</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        onPress={() => handleCompleteLesson(selectedLesson)}
                        className="flex-2 py-3 bg-emerald-600 rounded-lg flex-row justify-center items-center gap-2 shadow"
                      >
                        <CheckCircle size={16} color="#ffffff" />
                        <Text className="text-white text-xs font-bold">Провести (списать 1ч)</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
                    <Text className="text-xs uppercase font-semibold text-slate-400 mb-1">Заметки урока:</Text>
                    <Text className="text-xs text-slate-700 italic">"{selectedLesson.notes || "Заметок к этому занятию не оставлено."}"</Text>
                  </View>
                )}

                <View className="pt-6 border-t border-slate-100 mt-6 flex-row justify-between items-center">
                  <TouchableOpacity onPress={() => handleDelete(selectedLesson.id)} className="flex-row items-center gap-1.5 p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded">
                    <Trash2 size={14} color="#e11d48" />
                    <Text className="text-rose-600 text-6px font-bold">Удалить укрок</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setDetailModal(false)} className="px-4 py-2 border border-slate-200 rounded">
                    <Text className="text-xs font-semibold text-slate-500">Закрыть</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* SCHEDULE LESSON MODAL */}
      <Modal animationType="slide" transparent={true} visible={scheduleModal} onRequestClose={() => setScheduleModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <Text className="text-lg font-bold text-slate-900 mb-4">Назначить новое занятие</Text>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Выбрать студента</Text>
                <View className="bg-slate-50 rounded-lg p-1 max-h-[120px] overflow-y-auto flex flex-row flex-wrap gap-1">
                  {students.map((s) => (
                    <TouchableOpacity 
                      key={s.id} 
                      onPress={() => setStudentId(s.id)}
                      className={`px-3 py-1.5 rounded-md ${studentId === s.id ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <Text className={`text-xs ${studentId === s.id ? 'text-white font-bold' : 'text-slate-700'}`}>{s.name} ({s.balance}ч)</Text>
                    </TouchableOpacity>
                  ))}
                  {students.length === 0 && <Text className="text-xs text-rose-500 p-2">Сначала добавьте студента!</Text>}
                </View>
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1 font-bold">Тема урока</Text>
                <TextInput value={topic} onChangeText={setTopic} placeholder="Present Perfect, Новые слова..." className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 text-sm" />
              </View>

              <View className="grid grid-cols-2 gap-4">
                <View>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Дата урока</Text>
                  <TextInput value={date} onChangeText={setDate} placeholder="ГГГГ-ММ-ДД" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 text-sm" />
                </View>
                <View>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Время урока</Text>
                  <TextInput value={time} onChangeText={setTime} placeholder="ЧЧ:ММ" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 text-sm" />
                </View>
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Преподаватель</Text>
                <TextInput value={teacher} onChangeText={setTeacher} placeholder="Елена Смирнова" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 text-sm" />
              </View>
            </View>

            <View className="flex-row justify-end space-x-3 mt-6">
              <TouchableOpacity onPress={() => setScheduleModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-200">
                <Text className="text-xs font-semibold text-slate-400">Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateLesson} className="px-5 py-2.5 bg-indigo-600 rounded-lg">
                <Text className="text-xs font-bold text-white">Запланировать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}
