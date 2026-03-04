import { useMutation } from "@tanstack/react-query"
import { shopCategories } from "apps/seller-ui/src/utils/shop-categories"
import axios from "axios"
import { useState } from "react"
import { useForm } from "react-hook-form"

type ShopFormData = {
  name: string
  bio: string
  address: string
  opening_hours: string
  website?: string
  category: string
}

const CreateShop = ({
  sellerId,
  setActiveStep
} : {
  sellerId: string,
  setActiveStep: (step: number) => void
}) => {
  const [serverError, setServerError] = useState<string | null>(null)
  
  const {register, handleSubmit, formState: {errors}} = useForm<ShopFormData>()

  // Shop creation mutation
  const shopCreateMutation = useMutation({
    mutationFn: async (data: ShopFormData & { sellerId: string }) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/create-shop`,
        data
      )
      return response.data
    },
    onSuccess: () => {
      setActiveStep(3)
    },
    onError: (error: any) => {
      setServerError(
        error.response?.data?.message || "Shop creation failed"
      )
    }
  })

  // On submit handler
  const onSubmit = async (data: ShopFormData) => {
    setServerError(null)
    const shopData = {... data, sellerId}

    shopCreateMutation.mutate(shopData)
  }

  // Bio validation
  const countWords = (text: string) => text.trim().split(/\s+/).length
  
  return (
    <div className="">
      <form 
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <h3 className="text-3xl font-semibold text-center mb-2">
          Setup new shop
        </h3>

        {/* Shop name */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Name <span className="text-red-600 font-semibold">*</span>
          </label>
          <input
            type="text"
            placeholder="shop name"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#047857] outline-none"
            {...register("name", {
              required: "Name is required",
            })}
          />
          {errors.name && (
            <span className="text-red-500 text-sm">
              {String(errors.name.message)}
            </span>
          )}
        </div>

        {/* Shop bio */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Bio <span className="text-xs font-normal">(Max 100 words)</span> <span className="text-red-600 font-semibold">*</span>
          </label>
          <input
            type="text"
            placeholder="shop bio"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#047857] outline-none"
            {...register("bio", {
              required: "Shop Bio is required",
              validate: (value) => {
                return countWords(value) <= 100 || `Bio can't exceed 100 words`
              }
            })}
          />
          {errors.bio && (
            <span className="text-red-500 text-sm">
              {String(errors.bio.message)}
            </span>
          )}
        </div>

        {/* Shop address */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Address <span className="text-red-600 font-semibold">*</span>
          </label>
          <input
            type="text"
            placeholder="shop location"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#047857] outline-none"
            {...register("address", {
              required: "Address is required",
            })}
          />
          {errors.address && (
            <span className="text-red-500 text-sm">
              {String(errors.address.message)}
            </span>
          )}
        </div>

        {/* Opening hours */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Opening Hours <span className="text-red-600 font-semibold">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Mon-Fri | 9AM - 6PM"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#047857] outline-none"
            {...register("opening_hours", {
              required: "Opening Hours is required",
            })}
          />
          {errors.opening_hours && (
            <span className="text-red-500 text-sm">
              {String(errors.opening_hours.message)}
            </span>
          )}
        </div>

        {/* Website link */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Website
          </label>
          <input
            type="url"
            placeholder="https://example.com"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#047857] outline-none"
            {...register("website", {
              pattern: {
                value: /^(https?:\/\/)?([\w\d-]+\.)+\w{2,}(\/.*)?$/,
                message: "Enter a valid URL",
              }
            })}
          />
          {errors.website && (
            <span className="text-red-500 text-sm">
              {String(errors.website.message)}
            </span>
          )}
        </div>

        {/* Shop categories */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Category <span className="text-red-600 font-semibold">*</span>
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#047857] outline-none"
            {...register("category", {
              required: "Category is required",
            })}
          >
            <option value=''>
              Select a category
            </option>
            {shopCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <span className="text-red-500 text-sm">
              {String(errors.category.message)}
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

        {/* Create Button */}
        <button
          type="submit"
          disabled={shopCreateMutation.isPending}
          className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {shopCreateMutation.isPending ? 'Creating...' : 'Create'}
        </button>

      </form>
    </div>
  )
}

export default CreateShop