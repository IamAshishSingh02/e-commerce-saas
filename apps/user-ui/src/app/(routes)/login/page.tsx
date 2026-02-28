'use client'

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import GoogleButton from "../../shared/components/google-button"
import { Eye, EyeOff } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"

type FormData = {
  email: string
  password: string
}

const Login = () => {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)

  const router = useRouter()

  const {register, handleSubmit, formState: {errors}} = useForm<FormData>()

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/login-user`,
        {...data, rememberMe},
        {withCredentials: true}
      )
      return response.data
    },
    onSuccess: () => {
      setServerError(null)
      router.push('/')
    },
    onError: (error: any) => {
      setServerError(
        error.response?.data?.message || "Login failed"
      )
    }
  })

  // On Submit handler
  const onSubmit = (data: FormData) => {
    setServerError(null)
    loginMutation.mutate(data)
  }

  return (
    <div className="w-full py-10 min-h-[85vh] bg-slate-100">

      <h1 className="text-4xl font-Poppins font-semibold text-black text-center">
        Login
      </h1>

      <p className="text-center text-lg font-medium py-3 text-[#00000099]">
        Home . Login
      </p>

      <div className="w-full flex justify-center">
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">

          <h3 className="text-3xl font-semibold text-center mb-2">
            Login to Shop<span className="text-[#047857]">Verse</span>
          </h3>

          {/* Sign up redirection */}
          <p className="text-center text-gray-500 mb-4 text-sm">
            Don't have an account?{' '}
            <Link href={'/signup'} className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>

          {/* Google button */}
          <GoogleButton />

          {/* Divider Render */}
          <div className="flex items-center my-5 text-gray-400 text-sm">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-3">or Sign in with Email</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="youremail@gmail.com"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#047857] outline-none"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Invalid Email address",
                  },
                })}
              />
              {errors.email && (
                <span className="text-red-500 text-sm">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Password
              </label>

              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Min. 6 characters"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#047857] outline-none pr-10"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />

                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 hover:text-gray-600"
                >
                  {passwordVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>

              {errors.password && (
                <span className="text-red-500 text-sm">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex justify-between items-center text-sm">

              {/* Remember me */}
              <label className="flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="accent-[#047857]"
                />
                Remember me
              </label>

              {/* Forgot password */}
              <Link
                href="/forgot-password"
                className="text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>

            </div>

            {/* Server error */}
            <div className="w-full text-center mt-2">
              {serverError && (
                <span className="text-red-500 text-sm text-center mt-2 font-medium">
                  {serverError}
                </span>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </button>

          </form>

        </div>
      </div>

    </div>
  )
}

export default Login