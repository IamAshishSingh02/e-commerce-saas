'use client'

import { ChevronRight, Plus, Trash, X } from "lucide-react";
import { useState } from "react";
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../../utils/axios-instance";
import toast from "react-hot-toast";
import { Controller, useForm } from "react-hook-form";
import Input from "packages/components/input";
import DeleteDiscountCodeModal from "../../../../shared/components/modals/delete.discount-code";

interface DiscountCode {
  id: string
  publicName: string
  discountType: 'percentage' | 'flat'
  discountValue: number
  discountCode: string
}

const DiscountPage = () => {
  const [showModal, setShowModal] = useState(false)
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountCode | null>(null)

  // Query setup
  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["shop-discounts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-discount-codes");
      return res?.data?.code || [];
    },
  });

  // Use form
  const {register, handleSubmit, control, reset, formState: {errors}} = useForm({
    defaultValues: {
      publicName: '',
      discountType: 'percentage',
      discountValue: '',
      discountCode: ''
    }
  })

  // Discount code mutation
  const createDiscountCodeMutation = useMutation({
    mutationFn: async (data) => {
      await axiosInstance.post('/product/api/create-discount-code', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['shop-discounts']})
      toast.success('Discount code created successfully!')
      reset()
      setShowModal(false)
    },
    onError: (error: any) => {
      setServerError(
        error.response?.data?.message || "Discount Code creation failed!"
      )
    }
  })

  // Delete discount code mutation
  const deleteDiscountCodeMutation = useMutation({
    mutationFn: async (discountId: string) => {
      await axiosInstance.delete(`/product/api/delete-discount-code/${discountId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['shop-discounts']})
      setShowDeleteModal(false)
    },
    onError: (error: any) => {
      setServerError(
        error.response?.data?.message || "Discount Code deletion failed!"
      )
    }
  })

  // Handle delete discount code
  const handleDeleteCode = (code: any) => {
    setSelectedDiscount(code)
    setShowDeleteModal(true)
  }

  // Handle form on submit
  const onSubmit = (data: any) => {
    if(codes.length >= 8){
      toast.error('You can only create upto 8 discount codes!')
      return
    }
    setServerError(null)
    createDiscountCodeMutation.mutate(data)
  }

  return (
    <div className="w-full min-h-screen p-8 text-white">

      {/* Heading */}
      <div className="flex justify-between items-center mb-1">

        {/*  */}
        <h2 className="text-2xl text-white font-semibold">
          Discount Codes
        </h2>

        {/*  */}
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} /> Create Discount 
        </button>

      </div>

      {/* Tracker */}
      <div className="flex items-center">
        <Link href={'/dashboard'} className="text-[#80Deea] cursor-pointer">Dashboard</Link>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span>Discount Codes</span>
      </div>

      {/* Discount code table */}
      <div className="mt-8 bg-gray-900 p-6 rounded-lg shadow-lg">

        {/* Heading */}
        <h3 className="text-lg font-semibold text-white mb-4">
          Your Discount Codes
        </h3>

        {/* If codes available */}
        {isLoading ? (
          <p className="text-gray-400 text-center">Loading discount codes...</p>
        ) : (
          <table className="w-full text-white">

            {/* table header */}
            <thead>
              <tr className="border-b border-gray-800">
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Value</th>
                <th className="p-3 text-left">Code</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            {/* table body */}
            <tbody>
              {codes?.map((discount: any) => (
                <tr
                  key={discount?.id}
                  className="border-b border-gray-800 hover:bg-gray-800 transition"
                >
                  <td className="p-3">{discount?.publicName}</td>
                  <td className="p-3 capitalize">
                    {discount.discountType === "percentage"
                      ? "Percentage (%)"
                      : "Flat (₹)"}
                  </td>
                  <td className="p-3">
                    {discount.discountType === 'percentage'
                      ? `${discount.discountValue}%`
                      : `₹${discount.discountValue}`}
                  </td>
                  <td className="p-3 font-mono">{discount.discountCode}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDeleteCode(discount)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        )}

        {/* If codes not available */}
        {!isLoading && codes.length === 0 && (
          <p className="text-gray-400 w-full pt-4 block text-center">No discount codes available!</p>
        )}

      </div>

      {/* Create discount modal */}
      {showModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-[450px] shadow-lg">

            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">

              {/* Heading */}
              <h3>Create Discount Code</h3>

              {/* Cancel button */}
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={22} />
              </button>

            </div>

            {/* Form details */}
            <form onSubmit={handleSubmit(onSubmit)}>

              {/* Title */}
              <div className="mt-2">

                {/*  */}
                <Input
                  label="Title (Public Name)"
                  {...register("publicName", { required: "Title is required" })}
                />


                {/*  */}
                {errors.publicName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.publicName.message}
                  </p>
                )}

              </div>

              {/* Type */}
              <div className="mt-2">

                {/*  */}
                <label className="block font-semibold text-gray-300 mb-1">
                  Discount Type
                </label>

                {/*  */}
                <Controller
                  control={control}
                  name="discountType"
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full border outline-none border-gray-700 bg-gray-800 text-white p-2 rounded-md"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  )}
                />

              </div>

              {/* Value */}
              <div className="mt-2">

                {/*  */}
                <Input
                  label="Discount Value"
                  type="number"
                  min={1}
                  {...register("discountValue", {
                    required: "Value is required",
                  })}
                />

                {/*  */}
                {errors.discountValue && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.discountValue.message}
                  </p>
                )}

              </div>

              {/* Code */}
              <div className="mt-2">

                {/*  */}
                <Input
                  label="Discount Code"
                  {...register("discountCode", {
                    required: "Discount Code is required",
                    setValueAs: (value) => value.toUpperCase()
                  })}
                />

                {/*  */}
                {errors.discountCode && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.discountCode.message}
                  </p>
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

              {/* Create button */}
              <button
                type="submit"
                disabled={createDiscountCodeMutation.isPending}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                {createDiscountCodeMutation.isPending ? 'Creating...' : 'Create'}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* Delete discount modal */}
      {showDeleteModal && selectedDiscount && (
        <DeleteDiscountCodeModal 
          discount={selectedDiscount}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => deleteDiscountCodeMutation.mutate(selectedDiscount.id)}
        />
      )}

    </div>
  );
};

export default DiscountPage;