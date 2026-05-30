import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  level: string; // "Beginner (A1)", "Elementary (A2)", "Intermediate (B1)", "Upper-Intermediate (B2)", "Advanced (C1)"
  balance: number; // class hours left
  totalClasses: number;
  totalPaid: number;
  ageGroup: 'Kids' | 'Teens' | 'Adults';
  status: 'Active' | 'On Hold' | 'Completed';
  notes?: string;
}

export interface Lesson {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  teacherName: string;
  topic: string;
  duration: number; // in hours
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface Transaction {
  id: string;
  studentId?: string;
  studentName?: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: 'Tuition' | 'Salary' | 'Materials' | 'Rent' | 'Other';
  date: string; // YYYY-MM-DD
  description: string;
}

interface AuthState {
  user: { email: string; role: 'Admin' | 'Teacher' } | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface CRMState {
  auth: AuthState;
  students: {
    list: Student[];
    loading: boolean;
  };
  lessons: {
    list: Lesson[];
    loading: boolean;
  };
  billing: {
    transactions: Transaction[];
    loading: boolean;
  };
}

const isStorageAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && 'localStorage' in window && window.localStorage !== null;
  } catch (e) {
    return false;
  }
};

const loadState = <T>(key: string, defaultValue: T): T => {
  try {
    if (isStorageAvailable()) {
      const saved = window.localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (error) {
    console.warn('Failed to load state', error);
  }
  return defaultValue;
};

const saveState = <T>(key: string, data: T) => {
  try {
    if (isStorageAvailable()) {
      window.localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (error) {
    console.warn('Failed to save state', error);
  }
};

const initialStudents: Student[] = [
  { id: '1', name: 'test1', email: 'test1@school.com', phone: '+79998881122', level: 'B1', balance: 14, totalClasses: 24, totalPaid: 600, ageGroup: 'Adults', status: 'Active', notes: 'Тестовый профиль (test1) для проверки функционала.' },
  { id: '2', name: 'test2', email: 'test2@school.com', phone: '+79991234567', level: 'C1', balance: 8, totalClasses: 16, totalPaid: 450, ageGroup: 'Teens', status: 'Active', notes: 'Второй тестовый профиль (test2) – подготовка к экзаменам.' },
  { id: '3', name: 'test3', email: 'test3@school.com', phone: '+79997775533', level: 'A1', balance: 12, totalClasses: 20, totalPaid: 500, ageGroup: 'Kids', status: 'Active', notes: 'Третий тестовый профиль (test3) – начальный уровень.' },
  { id: '4', name: 'test4', email: 'test4@school.com', phone: '+79994443322', level: 'A2', balance: 6, totalClasses: 12, totalPaid: 300, ageGroup: 'Kids', status: 'Active', notes: 'Четвертый тестовый профиль (test4) – базовый уровень.' },
  { id: '5', name: 'test5', email: 'test5@school.com', phone: '+79992221100', level: 'B2', balance: 10, totalClasses: 18, totalPaid: 450, ageGroup: 'Adults', status: 'Active', notes: 'Пятый тестовый профиль (test5) – выше среднего.' }
];

const initialLessons: Lesson[] = [
  { id: 'l1', studentId: '1', studentName: 'test1', date: '2026-05-28', time: '10:00', teacherName: 'Елена Смирнова', topic: 'Времена Present Perfect vs Past Simple', duration: 1, status: 'Scheduled' },
  { id: 'l2', studentId: '2', studentName: 'test2', date: '2026-05-28', time: '14:30', teacherName: 'Дмитрий Иванов', topic: 'Структура эссе на экзамене IELTS', duration: 1.5, status: 'Scheduled' },
  { id: 'l3', studentId: '3', studentName: 'test3', date: '2026-05-29', time: '11:00', teacherName: 'Анна Павлова', topic: 'Приветствие и числительные', duration: 1, status: 'Scheduled' }
];

const initialTransactions: Transaction[] = [
  { id: 't1', studentId: '1', studentName: 'test1', amount: 600, type: 'Income', category: 'Tuition', date: '2026-05-10', description: 'Оплачен пакет 24 часа занятий' },
  { id: 't2', studentId: '2', studentName: 'test2', amount: 450, type: 'Income', category: 'Tuition', date: '2026-05-15', description: 'Оплачен разговорный курс 16 часов' },
  { id: 't3', amount: 350, type: 'Expense', category: 'Rent', date: '2026-05-01', description: 'Аренда учебного кабинета за май' },
  { id: 't4', amount: 500, type: 'Expense', category: 'Salary', date: '2026-05-25', description: 'Выплата зарплаты преподавателю Елене' }
];

const getInitialStudents = (): Student[] => loadState<Student[]>('students_list2', initialStudents);
const getInitialLessons = (): Lesson[] => loadState<Lesson[]>('lessons_list2', initialLessons);
const getInitialTransactions = (): Transaction[] => loadState<Transaction[]>('transactions_list2', initialTransactions);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: { email: 'admin@school.com', role: 'Admin' },
    isAuthenticated: true, // Auto-logged in for presentation speed & feedback
    loading: false
  } as AuthState,
  reducers: {
    login: (state, action: PayloadAction<{ email: string; role: 'Admin' | 'Teacher' }>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    }
  }
});

// Students slice
const studentsSlice = createSlice({
  name: 'students',
  initialState: {
    list: getInitialStudents(),
    loading: false
  },
  reducers: {
    addStudent: (state, action: PayloadAction<Omit<Student, 'id' | 'totalClasses' | 'totalPaid'>>) => {
      const newStudent: Student = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        totalClasses: action.payload.balance,
        totalPaid: action.payload.balance * 25 // standard rate
      };
      state.list.unshift(newStudent);
    },
    updateStudent: (state, action: PayloadAction<Student>) => {
      const index = state.list.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
    deleteStudent: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(s => s.id !== action.payload);
    },
    adjustBalance: (state, action: PayloadAction<{ id: string; amount: number }>) => {
      const student = state.list.find(s => s.id === action.payload.id);
      if (student) {
        student.balance = Math.max(0, student.balance + action.payload.amount);
      }
    }
  }
});

// Lessons slice
const lessonsSlice = createSlice({
  name: 'lessons',
  initialState: {
    list: getInitialLessons(),
    loading: false
  },
  reducers: {
    addLesson: (state, action: PayloadAction<Omit<Lesson, 'id'>>) => {
      const newLesson: Lesson = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9)
      };
      state.list.unshift(newLesson);
    },
    updateLessonStatus: (state, action: PayloadAction<{ id: string; status: Lesson['status']; notes?: string }>) => {
      const lesson = state.list.find(l => l.id === action.payload.id);
      if (lesson) {
        lesson.status = action.payload.status;
        if (action.payload.notes !== undefined) {
          lesson.notes = action.payload.notes;
        }
      }
    },
    deleteLesson: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(l => l.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder.addCase(studentsSlice.actions.deleteStudent, (state, action) => {
      state.list = state.list.filter(l => l.studentId !== action.payload);
    });
  }
});

// Billing slice
const billingSlice = createSlice({
  name: 'billing',
  initialState: {
    transactions: getInitialTransactions(),
    loading: false
  },
  reducers: {
    addTransaction: (state, action: PayloadAction<Omit<Transaction, 'id'>>) => {
      const newTx: Transaction = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9)
      };
      state.transactions.unshift(newTx);
    }
  },
  extraReducers: (builder) => {
    builder.addCase(studentsSlice.actions.deleteStudent, (state, action) => {
      state.transactions = state.transactions.filter(t => t.studentId !== action.payload);
    });
  }
});

export const { login, logout } = authSlice.actions;
export const { addStudent, updateStudent, deleteStudent, adjustBalance } = studentsSlice.actions;
export const { addLesson, updateLessonStatus, deleteLesson } = lessonsSlice.actions;
export const { addTransaction } = billingSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    students: studentsSlice.reducer,
    lessons: lessonsSlice.reducer,
    billing: billingSlice.reducer
  }
});

// Subscribe to store updates to persist the CRM data automatically
store.subscribe(() => {
  const state = store.getState();
  saveState('students_list2', state.students.list);
  saveState('lessons_list2', state.lessons.list);
  saveState('transactions_list2', state.billing.transactions);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
