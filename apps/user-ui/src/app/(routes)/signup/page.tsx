'use client'

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import GoogleButton from "../../shared/components/google-button"
import { Eye, EyeOff } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import toast from "react-hot-toast"

type FormData = {
  name: string
  email: string
  password: string
}

const Signup = () => {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showOtp, setShowOtp] = useState(false)
  const [canResend, setCanResend] = useState(true)
  const [otp, setOtp] = useState(['','','',''])
  const [timer, setTimer] = useState(60)
  const [userData, setUserData] = useState<FormData | null>(null)

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
    if (showOtp && inputRefs.current[0]) {
      inputRefs.current[0]?.focus()
    }
  }, [showOtp])

  const router = useRouter()

  const {register, handleSubmit, formState: {errors}} = useForm<FormData>()

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

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/user-registration`, 
        data
      )
      return response.data
    },
    onSuccess: (_, formData) => {
      setUserData(formData)
      setShowOtp(true)
      setServerError(null)
      startResendTimer()
    },
    onError: (error: any) => {
      setServerError(
        error.response?.data?.message || "Signup failed"
      )
    }
  })

  // Resend otp mutation
  const resendOtpMutation = useMutation({
    mutationFn: async () => {
      if(!userData)
        throw new Error("User data missing")
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/user-registration`,
        userData
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
      if(!userData)
        throw new Error("User data missing")
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-user`,
        {
          ...userData,
          otp: otp.join('')
        }
      )
      return response.data
    },
    onSuccess: () => {
      toast.success('Account created successfully!')
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
    if(userData){
      setServerError(null)
      resendOtpMutation.mutate()
    }
  }

  return (
    <div className="w-full py-10 min-h-[85vh] bg-slate-100">

      <h1 className="text-4xl font-Poppins font-semibold text-black text-center">
        Signup
      </h1>

      <p className="text-center text-lg font-medium py-3 text-[#00000099]">
        Home . Signup
      </p>

      <div className="w-full flex justify-center">
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">

          <h3 className="text-3xl font-semibold text-center mb-2">
            Signup to Shop<span className="text-[#047857]">Verse</span>
          </h3>

          {/* Log in redirection */}
          <p className="text-center text-gray-500 mb-4 text-sm">
            Already have an account?{' '}
            <Link href={'/login'} className="text-blue-600 hover:underline">
              Log in
            </Link>
          </p>

          {/* Google button */}
          <GoogleButton />

          {/* Divider Render */}
          <div className="flex items-center my-5 text-gray-400 text-sm">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-3">or Sign up with Email</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {!showOtp ? (
            <form 
              onSubmit={handleSubmit((data: FormData) => {
                setServerError(null)
                signupMutation.mutate(data)
              })} 
              className="space-y-4"
            >

              {/* Name */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="yourname"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#047857] outline-none"
                  {...register("name", {
                    required: "Name is required",
                  })}
                />
                {errors.name && (
                  <span className="text-red-500 text-sm">
                    {errors.name.message}
                  </span>
                )}
              </div>
              
              {/* Email */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
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

                  {/* Password toggle Button */}
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

              {/* Server error */}
              {serverError && (
                <div className="w-full text-center mt-2">
                <span className="text-red-500 text-sm text-center mt-2 font-medium">
                  {serverError}
                </span>
                </div>
              )}

              {/* Signup Button */}
              <button
                type="submit"
                disabled={signupMutation.isPending}
                className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signupMutation.isPending ? 'Signing up...' : 'Signup'}
              </button>

            </form>
          ) : (
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
                    className="w-12 h-12 text-center border border-slate-500 outline-none rounded-md focus:ring-1 focus:ring-[#047857] focus:border-[#047857]"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  />
                ))}
              </div>

              {/* Server error */}
              {serverError && (
                <div className="w-full text-center mt-2">
                <span className="text-red-500 text-sm text-center mt-2 font-medium">
                  {serverError}
                </span>
                </div>
              )}

              {/* Verify otp button */}
              <button 
                disabled={verifyOtpMutation.isPending || otp.some(d => d === '')}
                onClick={() => {
                  setServerError(null)
                  verifyOtpMutation.mutate()
                }}
                className="w-full bg-black text-white py-2 mt-4 rounded-md hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify OTP'}
              </button>

              {/* Resend Render */}
              <p className="text-center text-sm mt-4 text-gray-600">
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

        </div>
      </div>

    </div>
  )
}

export default Signup