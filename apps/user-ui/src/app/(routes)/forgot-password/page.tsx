'use client'

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import toast from 'react-hot-toast'
import { Eye, EyeOff } from "lucide-react"

type EmailFormData = {
  email: string
}

type PasswordFormData = {
  password: string
}

const ForgotPassword = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [canResend, setCanResend] = useState(true)
  const [otp, setOtp] = useState(['','','',''])
  const [timer, setTimer] = useState(60)
  const [serverError, setServerError] = useState<string | null>(null)
  const [passwordVisible, setPasswordVisible] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Clear timer if user redirects somewhere else while the timer is running
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // First otp box focus
  useEffect(() => {
    if (step === 'otp' && inputRefs.current[0]) {
      inputRefs.current[0]?.focus()
    }
  }, [step])

  const router = useRouter()

  const {register: registerEmail, handleSubmit: handleSubmitEmail, formState: {errors: emailErrors}} = useForm<EmailFormData>()
  const {register: registerPassword, handleSubmit: handleSubmitPassword, formState: {errors: passwordErrors}} = useForm<PasswordFormData>()

  // Resend otp timer
  const startResendTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    setTimer(60)
    setCanResend(false)

    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Request otp mutation
  const requestOtpMutation = useMutation({
    mutationFn: async ({email}: {email: string}) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/forgot-password-user`,
        {email}
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      setUserEmail(variables.email)
      setStep('otp')
      setServerError(null)
      startResendTimer()
    },
    onError: (error: any) => {
      setServerError(
        error.response?.data?.message || "Failed to send OTP"
      )
    }
  })

  // Resend otp mutation
  const resendOtpMutation = useMutation({
    mutationFn: async () => {
      if(!userEmail)
        throw new Error("Email is missing")
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/forgot-password-user`,
        {email: userEmail}
      )
      return response.data
    },
    onSuccess: () => {
      setServerError(null)
      setOtp(['','','',''])
      startResendTimer()
      toast.success('OTP resent successfully!')
    },
    onError: (error: any) => {
      setServerError(
        error.response?.data?.message || "Failed to resend OTP"
      )
    }
  })

  // Verify otp mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if(!userEmail)
        throw new Error("User data missing")
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-forgot-password-user`,
        {
          email: userEmail,
          otp: otp.join('')
        }
      )
      return response.data
    },
    onSuccess: () => {
      setStep('reset')
      setServerError(null)
    },
    onError: (error: any) => {
      setServerError(
        error.response?.data?.message || "OTP Verification failed"
      )
    }
  })

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({password}: {password: string}) => {
      if(!password)
        throw new Error("Password is missing")
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/reset-password-user`,
        {
          email: userEmail,
          newPassword: password
        }
      )
      return response.data
    },
    onSuccess: () => {
      toast.success('Password reset successfully! Please login with your new password.')
      setServerError(null)
      router.push('/login')
    },
    onError: (error: any) => {
      setServerError(
        error.response?.data?.message || "OTP Verification failed"
      )
    }
  })

  // Otp change handler
  const handleOtpChange = (index: number, value: string) => {
    if(!/^[0-9]?$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if(value && index < inputRefs.current.length - 1){
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Otp key down handler
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Backspace' && !otp[index] && index > 0){
      inputRefs.current[index - 1]?.focus()
    }

    // Submit on Enter
    if(e.key === 'Enter' && otp.every(digit => digit !== '')){
      e.preventDefault()
      setServerError(null)
      verifyOtpMutation.mutate()
    }
  }

  // Resend otp logic
  const resendOtp = () => {
    if(userEmail){
      setServerError(null)
      resendOtpMutation.mutate()
    }
  }

  // Email submit handler
  const onSubmitEmail = ({email}: EmailFormData) => {
    setServerError(null)
    requestOtpMutation.mutate({email})
  }

  // Password submit handler
  const onSubmitPassword = ({password}: PasswordFormData) => {
    setServerError(null)
    resetPasswordMutation.mutate({password})
  }

  return (
    <div className="w-full py-10 min-h-[85vh] bg-slate-100">

      <h1 className="text-4xl font-Poppins font-semibold text-black text-center">
        Forgot Password
      </h1>

      <p className="text-center text-lg font-medium py-3 text-[#00000099]">
        Home . Forgot-password
      </p>

      <div className="w-full flex justify-center">
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">

          {/* Step = email */}
          {step === 'email' && (
            <>
              <h3 className="text-3xl font-semibold text-center mb-2">
                Reset your password
              </h3>

              {/* Log in redirection */}
              <p className="text-center text-gray-500 mb-4 text-sm">
                Go back to{' '}
                <Link href={'/login'} className="text-blue-600 hover:underline">
                  Log in
                </Link>
              </p>

              <form 
                onSubmit={handleSubmitEmail(onSubmitEmail)} 
                className="space-y-4"
              >
                
                {/* Email */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="youremail@gmail.com"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#047857] outline-none"
                    {...registerEmail("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: "Invalid Email address",
                      },
                    })}
                  />
                  {emailErrors.email && (
                    <span className="text-red-500 text-sm">
                      {emailErrors.email.message}
                    </span>
                  )}
                </div>

                {/* Server error */}
                <div className="w-full text-center mt-2">
                  {serverError && (
                    <span className="text-red-500 text-sm text-center mt-2 font-medium">
                      {serverError}
                    </span>
                  )}
                </div>

                {/* Request otp Button */}
                <button
                  type="submit"
                  disabled={requestOtpMutation.isPending}
                  className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {requestOtpMutation.isPending ? 'Sending OTP...' : 'Request OTP'}
                </button>

              </form>
            </>
          )}

          {/* Step = otp */}
          {step === 'otp' && (
              <div>
                <h3 className="text-xl font-semibold text-center mb-4">Enter OTP</h3>

                {/* Otp boxes */}
                <div className="flex justify-center gap-6">
                  {otp.map((digit, index) => (
                    <input 
                      key={index} 
                      type="text" 
                      ref={(e) => {
                        if(e) inputRefs.current[index] = e
                      }} 
                      maxLength={1}
                      className="w-12 h-12 text-center border border-slate-500 outline-none rounded-md"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    />
                  ))}
                </div>

                {/* Server error */}
                <div className="w-full text-center mt-2">
                  {serverError && (
                    <span className="text-red-500 text-sm text-center mt-2 font-medium">
                      {serverError}
                    </span>
                  )}
                </div>

                {/* Verify otp button */}
                <button 
                  disabled={verifyOtpMutation.isPending || otp.some(d => d === '')}
                  onClick={() => {
                    setServerError(null)
                    verifyOtpMutation.mutate()
                  }}
                  className="w-full bg-black text-white py-2 mt-4 rounded-md hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyOtpMutation.isPending ? 'Verifying' : 'Verify OTP'}
                </button>

                {/* Resend Render */}
                <p className="text-center text-sm mt-4">
                  {canResend ? (
                    <button
                      onClick={resendOtp}
                      disabled={resendOtpMutation.isPending}
                      className="text-blue-600 hover:underline disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    `Resend OTP in ${timer}s`
                  )}
                </p>

              </div>
          )}

          {/* Step = reset */}
          {step === 'reset' && (
            <>
              <h3 className="text-xl font-semibold text-center mb-4">
                Reset Password
              </h3>

              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">

                {/* Password */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    New Password
                  </label>

                  <div className="relative">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Min. 6 characters"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#047857] outline-none pr-10"
                      {...registerPassword("password", {
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

                  {passwordErrors.password && (
                    <span className="text-red-500 text-sm">
                      {passwordErrors.password.message}
                    </span>
                  )}
                </div>

                {/* Server error */}
                <div className="w-full text-center mt-2">
                  {serverError && (
                    <span className="text-red-500 text-sm text-center mt-2 font-medium">
                      {serverError}
                    </span>
                  )}
                </div>

                {/* Reset Button */}
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </button>

              </form>
            </>
          )}

        </div>
      </div>

    </div>
  )
}

export default ForgotPassword