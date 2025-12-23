import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Log in" />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>

                <div className="w-full max-w-md relative z-10">
                    {/* Logo and Title Section */}
                    <div className="text-center mb-10 animate-fadeIn">
                        <div className="inline-block mb-6 transform hover:scale-105 transition-transform duration-300">
                            <img 
                                src="/asset/icon_lagistraa.png" 
                                alt="S-LeGISTRA Logo" 
                                className="h-20 w-auto mx-auto drop-shadow-lg"
                            />
                        </div>
                        <h1 className="text-3xl font-light text-slate-800 tracking-tight mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-sm text-slate-500 font-light">
                            Sign in to access your dashboard
                        </p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 p-8 animate-slideUp">
                        {status && (
                            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 animate-fadeIn">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-6">
                            {/* Email Field */}
                            <div className="group">
                                <InputLabel 
                                    htmlFor="email" 
                                    value="Email Address" 
                                    className="text-sm font-medium text-slate-700 mb-2 block"
                                />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 outline-none"
                                    placeholder="you@example.com"
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} className="mt-2 text-xs" />
                            </div>

                            {/* Password Field */}
                            <div className="group">
                                <InputLabel 
                                    htmlFor="password" 
                                    value="Password" 
                                    className="text-sm font-medium text-slate-700 mb-2 block"
                                />
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 outline-none"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                <InputError message={errors.password} className="mt-2 text-xs" />
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center group cursor-pointer">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="ml-2 text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                                        Remember me
                                    </span>
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                )}
                            </div>

                            {/* Submit Button */}
                            <PrimaryButton 
                                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-medium py-3 px-6 rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]" 
                                disabled={processing}
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </PrimaryButton>
                        </form>
                    </div>

                    {/* Footer */}
                    <p className="text-center mt-6 text-xs text-slate-500">
                        Sawit Lestari Group Integrated Spatial Analytics
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out;
                }

                .animate-slideUp {
                    animation: slideUp 0.6s ease-out 0.2s backwards;
                }
            `}</style>
        </>
    );
}