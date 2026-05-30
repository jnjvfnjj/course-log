import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native';
import { useDispatch } from 'react-redux';
import { login } from '../../store';
import { LogIn, BookOpen, UserCheck, Shield } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('admin@school.com');
  const [password, setPassword] = useState('password');
  const [role, setRole] = useState<'Admin' | 'Teacher'>('Admin');
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  const handleLogin = () => {
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    dispatch(login({ email, role }));
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-slate-50 justify-center">
      <View className="flex-1 flex bg-slate-100 flex-row justify-center items-center py-10 px-4">
        {/* Core Auth Card Content */}
        <View className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          
          {/* Top Banner Accent */}
          <View className="bg-slate-900 px-6 py-8 items-center justify-center text-center">
            <View className="bg-indigo-500 p-3 rounded-full mb-3 flex items-center justify-center">
              <BookOpen size={28} color="#ffffff" />
            </View>
            <Text className="text-2xl font-bold text-white tracking-wide">
              Академия Bridge
            </Text>
            <Text className="text-sm text-indigo-200 mt-1">
              CRM-система языковой школы
            </Text>
          </View>

          {/* Form */}
          <View className="p-8">
            <Text className="text-xl font-semibold text-slate-800 mb-6 text-center">
              Вход в личный кабинет
            </Text>

            {error ? (
              <View className="mb-4 bg-red-50 p-3 rounded-lg border border-red-200">
                <Text className="text-red-600 text-xs font-semibold">{error}</Text>
              </View>
            ) : null}

            {/* Role Tab Selector */}
            <View className="flex flex-row bg-slate-100 rounded-lg p-1 mb-6">
              <TouchableOpacity
                onPress={() => setRole('Admin')}
                className={`flex-1 py-2 flex-row justify-center items-center rounded-md ${
                  role === 'Admin' ? 'bg-white shadow' : ''
                }`}
              >
                <Shield size={16} color={role === 'Admin' ? '#6366f1' : '#64748b'} className="mr-2" />
                <Text className={`text-xs font-medium ${role === 'Admin' ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>
                  Администратор
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRole('Teacher')}
                className={`flex-1 py-2 flex-row justify-center items-center rounded-md ${
                  role === 'Teacher' ? 'bg-white shadow' : ''
                }`}
              >
                <UserCheck size={16} color={role === 'Teacher' ? '#6366f1' : '#64748b'} className="mr-2" />
                <Text className={`text-xs font-medium ${role === 'Teacher' ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>
                  Преподаватель
                </Text>
              </TouchableOpacity>
            </View>

            {/* Email Field */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-slate-600 uppercase mb-2">
                Электронная почта
              </Text>
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                placeholder="admin@school.com"
                keyboardType="email-address"
                autoCapitalize="none"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white"
              />
            </View>

            {/* Password Field */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-slate-600 uppercase mb-2">
                Пароль
              </Text>
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                placeholder="••••••••"
                secureTextEntry
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white"
              />
            </View>

            {/* Sign In button */}
            <TouchableOpacity
              onPress={handleLogin}
              className="w-full bg-indigo-600 hover:bg-indigo-700 py-3.5 rounded-lg flex-row justify-center items-center shadow-lg shadow-indigo-200"
            >
              <LogIn size={18} color="#ffffff" className="mr-2" />
              <Text className="text-white text-sm font-bold tracking-wide">
                Войти как {role === 'Admin' ? 'Администратор' : 'Преподаватель'}
              </Text>
            </TouchableOpacity>

            <View className="mt-8 pt-6 border-t border-slate-100 flex items-center">
              <Text className="text-xs text-slate-400">
                Авторизационные данные: admin@school.com (любой пароль)
              </Text>
            </View>
          </View>

        </View>
      </View>
    </ScrollView>
  );
}
