'use client'

import { useEffect, useRef, useState } from "react"
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { Eye, EyeOff } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import toast from "react-hot-toast"
import { isValidPhoneNumber } from "libphonenumber-js";
import { countries } from "../../../utils/countries"
import CreateShop from "../../../shared/modules/auth/create-shop"
import StripeIcon from "../../../assets/svg/stripe-icon"

type FormData = {
  name: string
  email: string
  password: string
  phone_number: string
  country: string
}

const Signup = () => {
  const [sellerId, setSellerId] = useState('')
  const [activeStep, setActiveStep] = useState(1)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showOtp, setShowOtp] = useState(false)
  const [canResend, setCanResend] = useState(true)
  const [otp, setOtp] = useState(['','','',''])
  const [timer, setTimer] = useState(60)
  const [sellerData, setSellerData] = useState<FormData | null>(null)

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
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/seller-registration`, 
        data
      )
      return response.data
    },
    onSuccess: (_, formData) => {
      setSellerData(formData)
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
      if(!sellerData)
        throw new Error("User data missing")
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/seller-registration`,
        sellerData
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
      if(!sellerData)
        throw new Error("User data missing")
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-seller`,
        {
          ...sellerData,
          otp: otp.join('')
        }
      )
      return response.data
    },
    onSuccess: (data) => {
      setSellerId(data?.seller?.id)
      setActiveStep(2)
    },
    onError: (error: any) => {
      setServerError(
        error.response?.data?.message || "OTP Verification failed"
      )
    }
  })

  // Otp change handler
  const handleOtpChange = (
    index: number, 
    value: string
  ) => {
    if(!/^[0-9]?$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if(value && index < inputRefs.current.length - 1){
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Otp key down handler
  const handleOtpKeyDown = (
    index: number, 
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {

    // Previous box on Backspace
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
    if(sellerData){
      setServerError(null)
      resendOtpMutation.mutate()
    }
  }

  // Connect Stripe 
  const connectStripe = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/create-stripe-link`,
        {sellerId}
      )

      if(response.data.url){
        window.location.href = response.data.url
      }
    } catch (error) {
      console.error('Stripe connection error: ', error)
    }
  }

  return (
    <div className="w-full flex flex-col items-center pt-10 min-h-screen">

      {/* Stepper */}
      <div className="relative flex items-center justify-between md:w-[50%] mb-8">
        <div className="absolute top-[25%] left-0 w-[80%] md:w-[90%] h-1 bg-gray-300 -z-10" />

        {[1, 2, 3].map((step) => (
          <div key={step}>

            <div className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-semibold ${step <= activeStep ? 'bg-blue-600' : 'bg-gray-300'}`}>
              {step}
            </div>

            <span className="ml-[-15px]">
              {step ===1 ? 'Create Account': step ===2 ? 'Setup Shop' : 'Connect Bank'}
            </span>

          </div>
        ))}

      </div>

      {/* Steps content */}
      <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">

        {/* Step 1 content */}
        {activeStep === 1 && (
          <> 
            {!showOtp ? (
              <form 
                onSubmit={handleSubmit((data: FormData) => {
                  setServerError(null);
                  const cleaned = data.phone_number.replace(/\s+/g, "");
                  data.phone_number = cleaned.startsWith("+")
                    ? cleaned
                    : "+" + cleaned;

                  signupMutation.mutate(data);
                })} 
                className="space-y-4"
              >
                <h3 className="text-3xl font-semibold text-center mb-2">
                  Create Account
                </h3>

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

                {/* Phone number */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#047857] outline-none"
                    {...register("phone_number", {
                      required: "Phone number is required",
                      validate: (value) => {
                        if (!value) return "Phone number is required";

                        const cleaned = value.replace(/\s+/g, "");
                        const fullNumber = cleaned.startsWith("+")
                          ? cleaned
                          : "+" + cleaned;

                        return (
                          isValidPhoneNumber(fullNumber) ||
                          "Enter a valid phone number"
                        );
                      }
                    })}
                  />
                  {errors.phone_number && (
                    <span className="text-red-500 text-sm">
                      {errors.phone_number.message}
                    </span>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#047857] outline-none"
                    {...register("country", {
                      required: "Country is required",
                    })}
                  >
                    <option value=''>
                      Select your country
                    </option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>

                  {errors.country && (
                    <span className="text-red-500 text-sm">
                      {errors.country.message}
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
                  {signupMutation.isPending ? 'Continuing...' : 'Continue'}
                </button>

                {/* Log in redirection */}
                <p className="text-center text-gray-500 mb-4 text-sm">
                  Already have an account?{' '}
                  <Link href={'/login'} className="text-blue-600 hover:underline">
                    Log in
                  </Link>
                </p>

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
          </>
        )}

        {/* Step 2 content */}
        {activeStep === 2 && (
          <CreateShop
            sellerId={sellerId}
            setActiveStep={setActiveStep} 
          />
        )}

        {/* Step 3 content */}
        {activeStep === 3 && (
          <div className="text-center">
            <h3 className="text-2xl font-semibold">
              Withdraw Method
            </h3>

            <br />

            <button 
              className="w-full m-auto flex items-center justify-center gap-3 text-lg bg-black text-white py-2 rounded-lg"
              onClick={connectStripe}
            >
              Connect Stripe <StripeIcon />
            </button>
          </div>
        )}

      </div>

    </div>
  )
}

export default Signup