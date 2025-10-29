import React, { useState } from 'react';
import { Illustration } from './Illustration';
import { TicketIcon } from './icons/TicketIcon';

interface LoginPageProps {
  onLogin: (username: string, password: string) => void;
  error: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl flex overflow-hidden">
        <div className="hidden lg:flex w-1/2 items-center justify-center p-8">
          <Illustration />
        </div>
        <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
            <TicketIcon className="mx-auto h-10 w-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-800 mt-4">
              Ticketing System Login
            </h1>
            <p className="text-slate-500 mt-2">
              Please sign in to continue
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700 sr-only"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 sr-only"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;