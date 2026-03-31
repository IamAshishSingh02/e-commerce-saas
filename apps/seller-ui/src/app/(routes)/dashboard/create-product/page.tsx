"use client";

import ColorSelector from "packages/components/color-selector";
import ImagePlaceHolder from "../../../../shared/components/image-placeholder";
import { ChevronRight, Wand, X } from "lucide-react";
import Input from "packages/components/input";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import CustomSpecifications from "packages/components/custom-specifications";
import CustomProperties from "packages/components/custom-properties";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "apps/seller-ui/src/utils/axios-instance";
import RichTextEditor from "packages/components/rich-text-editor";
import SizeSelector from "packages/components/size-selector";
import Link from "next/link";
import toast from "react-hot-toast";
import Image from "next/image";
import { enhancements } from "../../../../utils/ai.enhancements";
import { useRouter } from "next/navigation";

interface ImageInterface {
  url: string;
  fileId: string;
}

const EFFECT_GROUPS = {
  background: ["e-removebg"],
  enhance: ["e-retouch", "e-upscale"],
  styling: ["e-dropshadow"],
};

const Page = () => {
  const {
    register,
    getValues,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    shouldFocusError: true,
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [isChanged, setIsChanged] = useState(true);
  const [images, setImages] = useState<(ImageInterface | null)[]>([null]);
  const [loading, setLoading] = useState(false);
  const [pictureUploadingLoader, setPictureUploadingLoader] = useState(false);
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  const [processing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  // Query setup for categories
  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-categories");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Query setup for discount codes
  const { data: codes = [], isLoading: discountLoading } = useQuery({
    queryKey: ["shop-discounts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-discount-codes");
      return res?.data?.code || [];
    },
  });

  const categories = data?.categories || [];
  const subCategoriesData = data?.subCategories || {};
  const selectedCategory = watch("category");

  // handle sub-categories according to the category
  const subCategories = useMemo(() => {
    return selectedCategory ? subCategoriesData[selectedCategory] || [] : [];
  }, [selectedCategory, subCategoriesData]);

  // handle on submit
  const onSubmit = async (data: any) => {
    setServerError(null);
    setLoading(true);

    try {
      const validImages = images.filter((img) => img !== null);
      const productData = {
        title: data.title,
        shortDescription: data.shortDescription,
        detailedDescription: data.detailedDescription,
        category: data.category,
        subCategory: data.subCategory,
        slug: data.slug,
        tags: data.tags,
        warranty: data.warranty,
        brand: data.brand || null,
        videoUrl: data.videoUrl || null,
        regularPrice: data.regularPrice,
        salePrice: data.salePrice,
        stock: data.stock,
        colors: data.colors || [],
        sizes: data.sizes || [],
        cashOnDelivery: data.cashOnDelivery === "yes",
        discountCodes: data.discountCodes || [],
        customSpecifications: data.customSpecifications || {},
        customProperties: data.customProperties || {},
        images: validImages,
      };

      await axiosInstance.post("/product/api/create-product", productData);
      toast.success("Product created successfully!");
      router.push("/dashboard/all-products");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Product creation failed!";
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Shows form errors and validate images
  const onError = (errors: any) => {
    const validImages = images.filter((img) => img !== null);

    if (validImages.length === 0) {
      setImageError(true);
      toast.error("Please upload at least one product image!");
      return;
    }

    toast.error("Please fix the form errors before submitting.");
  };

  // Base 64 converter
  const convertToBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // handle image change
  const handleImageChange = async (file: File | null, index: number) => {
    if (!file) return;
    setPictureUploadingLoader(true);

    try {
      const base64 = await convertToBase64(file);

      const response = await axiosInstance.post(
        "/product/api/upload-product-image",
        { file: base64 },
      );

      const updatedImages = [...images];
      const imageUrl = response.data.url;
      updatedImages[index] = {
        url: imageUrl,
        fileId: response.data.fileName,
      };

      if (index === images.length - 1 && updatedImages.length < 8) {
        updatedImages.push(null);
      }

      setImages(updatedImages);
      setValue("images", updatedImages);
    } catch (error) {
      console.error(error);
      toast.error("Image upload failed");
    } finally {
      setPictureUploadingLoader(false);
      setImageError(false);
    }
  };

  // handle remove image change
  const handleRemoveImage = async (index: number) => {
    try {
      const updatedImages = [...images];

      const imageToDelete = updatedImages[index];

      if (imageToDelete && typeof imageToDelete === "object") {
        await axiosInstance.delete("/product/api/delete-product-image", {
          data: {
            fileId: imageToDelete.fileId,
          },
        });
      }

      updatedImages.splice(index, 1);

      if (!updatedImages.includes(null) && updatedImages.length < 8) {
        updatedImages.push(null);
      }

      setImages(updatedImages);
      setValue("images", updatedImages);
    } catch (error) {
      console.error(error);
    }
  };

  // Apply AI transformations
  const applyTransformation = (effect: string) => {
    if (!selectedImage || processing) return;

    setActiveEffects((prev) => {
      const group = Object.keys(EFFECT_GROUPS).find((key) =>
        EFFECT_GROUPS[key as keyof typeof EFFECT_GROUPS].includes(effect),
      );

      if (!group) return prev;

      const filtered = prev.filter(
        (e) => !EFFECT_GROUPS[group as keyof typeof EFFECT_GROUPS].includes(e),
      );

      if (filtered.includes(effect)) {
        return filtered.filter((e) => e !== effect);
      }

      return [...filtered, effect];
    });
  };

  // Transformed image
  const getTransformedImage = () => {
    if (!selectedImage) return "";

    const baseUrl = selectedImage.split("?")[0];

    if (activeEffects.length === 0) return baseUrl;

    return `${baseUrl}?tr=${activeEffects.join(",")}`;
  };

  // handle save draft
  const handleSaveDraft = async () => {
    const formData = getValues();

    if (!formData.title) {
      toast.error("Title is required for saving draft!");
      return;
    }

    if (!formData.slug) {
      toast.error("Slug is required for saving draft!");
      return;
    }

    setLoading(true);
    setServerError(null);

    try {
      const validImages = images.filter((img) => img !== null);

      const draftData = {
        title: formData.title,
        shortDescription: formData.shortDescription || "",
        detailedDescription: formData.detailedDescription || "",
        category: formData.category || "",
        subCategory: formData.subCategory || "",
        slug: formData.slug,
        tags: formData.tags || "",
        warranty: formData.warranty || "",
        brand: formData.brand || null,
        videoUrl: formData.videoUrl || null,
        regularPrice: formData.regularPrice || 0,
        salePrice: formData.salePrice || 0,
        stock: formData.stock || 0,
        colors: formData.colors || [],
        sizes: formData.sizes || [],
        cashOnDelivery: formData.cashOnDelivery === "yes",
        discountCodes: formData.discountCodes || [],
        customSpecifications: formData.customSpecifications || {},
        customProperties: formData.customProperties || {},
        images: validImages,
      };

      await axiosInstance.post("/product/api/save-draft-product", draftData);
      toast.success("Draft saved successfully!");
      setIsChanged(false);
      router.push("/dashboard/all-products");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Draft save failed!";
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onError)}
      className="w-full mx-auto p-8 shadow-md rounded-lg text-white"
    >
      {/* Heading */}
      <h2 className="text-2xl py-2 font-semibold font-poppins text-white">
        Create Product
      </h2>

      {/* Tracker */}
      <div className="flex items-center">
        <Link href={"/dashboard"} className="text-[#80deea] cursor-pointer">
          Dashboard
        </Link>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span>Create Product</span>
      </div>

      {/* Main Content */}
      <div className="py-4 w-full flex gap-6">
        {/* Left side - Image upload section */}
        <div className="md:w-[35%]">
          {/* Main image */}
          <div
            className={`${imageError ? "border-2 border-red-500 p-2 rounded-lg" : ""}`}
          >
            {images?.length > 0 && (
              <ImagePlaceHolder
                setOpenImageModal={setOpenImageModal}
                size="765 x 850"
                small={false}
                index={0}
                pictureUploadingLoader={pictureUploadingLoader}
                onImageChange={handleImageChange}
                images={images}
                setSelectedImage={setSelectedImage}
                onRemove={handleRemoveImage}
              />
            )}
            {imageError && (
              <p className="text-red-500 text-sm mt-2">
                Please upload at least one product image
              </p>
            )}
          </div>

          {/* Other images */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {images.slice(1).map((_, index) => (
              <ImagePlaceHolder
                setOpenImageModal={setOpenImageModal}
                size="765 x 850"
                key={`image-${index}`}
                small={true}
                index={index + 1}
                pictureUploadingLoader={pictureUploadingLoader}
                onImageChange={handleImageChange}
                images={images}
                setSelectedImage={setSelectedImage}
                onRemove={handleRemoveImage}
              />
            ))}
          </div>
        </div>

        {/* Right side - form inputs */}
        <div className="md:w-[65%]">
          <div className="w-full flex gap-6">
            {/* Product Details 1 */}
            <div className="w-2/4">
              {/* Product Title Input */}
              <div>
                <Input
                  label={
                    <>
                      Product Title <span className="text-red-600">*</span>
                    </>
                  }
                  placeholder="Enter product title"
                  {...register("title", {
                    required: "Title is required",
                  })}
                />
                {errors.title && (
                  <span className="text-red-500 text-sm">
                    {errors.title.message as string}
                  </span>
                )}
              </div>

              {/* Text area */}
              <div className="mt-2">
                <Input
                  type="textarea"
                  rows={7}
                  cols={10}
                  label={
                    <>
                      Short description <span className="text-red-600">*</span>
                    </>
                  }
                  placeholder="Enter product description for quick view"
                  {...register("shortDescription", {
                    required: "Description is required",
                    validate: (value) => {
                      const wordCount = value.trim().split(/\s+/).length;
                      return (
                        wordCount <= 150 ||
                        `Description cannot exceed 150 words (Current: ${wordCount})`
                      );
                    },
                  })}
                />
                {errors.shortDescription && (
                  <span className="text-red-500 text-sm">
                    {errors.shortDescription.message as string}
                  </span>
                )}
              </div>

              {/* Tags */}
              <div className="mt-2">
                <Input
                  label={
                    <>
                      Tags <span className="text-red-600">*</span>
                    </>
                  }
                  placeholder="apple, flagship, etc."
                  {...register("tags", {
                    required: "Separate related products tags with a comma",
                  })}
                />
                {errors.tags && (
                  <span className="text-red-500 text-sm">
                    {errors.tags.message as string}
                  </span>
                )}
              </div>

              {/* Warranty */}
              <div className="mt-2">
                <Input
                  label={
                    <>
                      Warranty <span className="text-red-600">*</span>
                    </>
                  }
                  placeholder="1 year / No warranty"
                  {...register("warranty", {
                    required: "Warranty is required",
                  })}
                />
                {errors.warranty && (
                  <span className="text-red-500 text-sm">
                    {errors.warranty.message as string}
                  </span>
                )}
              </div>

              {/* Slug */}
              <div className="mt-2">
                <Input
                  label={
                    <>
                      Slug <span className="text-red-600">*</span>
                    </>
                  }
                  placeholder="product slug"
                  {...register("slug", {
                    required: "Slug is required",
                    pattern: {
                      value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                      message:
                        "Invalid slug format! Use only lowercase letters, numbers, and hyphens.",
                    },
                    minLength: {
                      value: 3,
                      message: "Slug must be at least 3 characters long.",
                    },
                    maxLength: {
                      value: 50,
                      message: "Slug cannot be longer than 50 characters",
                    },
                  })}
                />
                {errors.slug && (
                  <span className="text-red-500 text-sm">
                    {errors.slug.message as string}
                  </span>
                )}
              </div>

              {/* Brand */}
              <div className="mt-2">
                <Input
                  label={<>Brand</>}
                  placeholder="Samsung, Apple, etc."
                  {...register("brand")}
                />
                {errors.brand && (
                  <span className="text-red-500 text-sm">
                    {errors.brand.message as string}
                  </span>
                )}
              </div>

              {/* Color selector */}
              <div className="mt-2">
                <ColorSelector control={control} errors={errors} />
              </div>

              {/* Custom specifications */}
              <div className="mt-2">
                <CustomSpecifications control={control} errors={errors} />
              </div>

              {/* Custom properties */}
              <div className="mt-2">
                <CustomProperties control={control} errors={errors} />
              </div>

              {/* COD option */}
              <div className="mt-2">
                {/*  */}
                <label className="block font-semibold text-gray-300 mb-1">
                  Cash On Delivery <span className="text-red-600">*</span>
                </label>

                {/*  */}
                <select
                  {...register("cashOnDelivery", {
                    required: "Cash on Delivery is required",
                  })}
                  defaultValue="yes"
                  className="w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md"
                >
                  <option value="yes" className="bg-black">
                    Yes
                  </option>

                  <option value="no" className="bg-black">
                    No
                  </option>
                </select>

                {/*  */}
                {errors.cashOnDelivery && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.cashOnDelivery.message as string}
                  </span>
                )}
              </div>
            </div>

            {/* Product Details 2 */}
            <div className="w-2/4">
              {/* Category */}
              <div>
                {/*  */}
                <label className="block font-semibold text-gray-300 mb-1">
                  Category <span className="text-red-600">*</span>
                </label>

                {/*  */}
                {isLoading ? (
                  <p className="text-gray-400">Loading categories...</p>
                ) : isError ? (
                  <p className="text-red-500">Failed to load categories</p>
                ) : (
                  <Controller
                    name="category"
                    control={control}
                    rules={{ required: "Category is required" }}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md"
                      >
                        {" "}
                        <option value="" className="bg-black">
                          Select Category
                        </option>
                        {categories?.map((category: string) => (
                          <option
                            value={category}
                            key={category}
                            className="bg-black"
                          >
                            {category}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                )}

                {/*  */}
                {errors.category && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.category.message as string}
                  </span>
                )}
              </div>

              {/* Sub category */}
              <div className="mt-2">
                {/*  */}
                <label className="block font-semibold text-gray-300 mb-1">
                  Sub-Category <span className="text-red-600">*</span>
                </label>

                {/*  */}
                {isLoading ? (
                  <p className="text-gray-400">Loading sub-categories...</p>
                ) : isError ? (
                  <p className="text-red-500">Failed to load sub-categories</p>
                ) : (
                  <Controller
                    name="subCategory"
                    control={control}
                    rules={{ required: "Sub-Category is required" }}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md"
                      >
                        {" "}
                        <option value="" className="bg-black">
                          Select Sub-Category
                        </option>
                        {subCategories?.map((subCategory: string) => (
                          <option
                            value={subCategory}
                            key={subCategory}
                            className="bg-black"
                          >
                            {subCategory}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                )}

                {/*  */}
                {errors.subCategory && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.subCategory.message as string}
                  </span>
                )}
              </div>

              {/* Detailed description */}
              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Detailed Description
                  <span className="text-xs font-normal"> (Min 100 words)</span>
                  <span className="text-red-600">*</span>
                </label>

                <Controller
                  name="detailedDescription"
                  control={control}
                  defaultValue=""
                  rules={{
                    required: "Detailed description is required!",
                    validate: (value) => {
                      // remove html tags
                      const text = value?.replace(/<[^>]*>/g, "") || "";

                      // better word counting
                      const words = text.match(/\b\w+\b/g) || [];

                      if (words.length < 100) {
                        return `Description must be at least 100 words (Current: ${words.length})`;
                      }

                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                {errors.detailedDescription && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.detailedDescription.message as string}
                  </span>
                )}
              </div>

              {/* Video url */}
              <div className="mt-2">
                <Input
                  label="Video URL"
                  placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://www.youtube.com/embed/VIDEO_ID"
                  {...register("videoUrl", {
                    pattern: {
                      value:
                        /^https:\/\/(www\.)?youtube\.com\/(watch\?v=|embed\/)[a-zA-Z0-9_-]+$/,
                      message:
                        "Enter a valid YouTube URL (watch or embed format)",
                    },
                  })}
                />

                {errors.videoUrl && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.videoUrl.message as string}
                  </span>
                )}
              </div>

              {/* Regular price */}
              <div className="mt-2 flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-300">
                  Regular Price <span className="text-red-600">*</span>
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    ₹
                  </span>

                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="Enter price"
                    className="w-full pl-7 pr-3 py-2 border border-gray-700 bg-transparent rounded-md outline-none text-white"
                    {...register("regularPrice", {
                      valueAsNumber: true,
                      min: {
                        value: 1,
                        message: "Price must be at least ₹1",
                      },
                      validate: (value) =>
                        !isNaN(value) || "Only numbers are allowed",
                    })}
                  />
                </div>

                {errors.regularPrice && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.regularPrice.message as string}
                  </p>
                )}
              </div>

              {/* Sales price */}
              <div className="mt-2 flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-300">
                  Sales Price
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    ₹
                  </span>

                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="Enter sale price"
                    className="w-full pl-7 pr-3 py-2 border border-gray-700 bg-transparent rounded-md outline-none text-white"
                    {...register("salePrice", {
                      valueAsNumber: true,
                      min: {
                        value: 1,
                        message: "Sales price must be at least ₹1",
                      },
                      validate: (value) => {
                        if (isNaN(value)) return "Only numbers are allowed";

                        const regularPrice = getValues("regularPrice");

                        if (regularPrice && value >= regularPrice) {
                          return "Sales price must be less than regular price";
                        }

                        return true;
                      },
                    })}
                  />
                </div>

                {errors.salePrice && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.salePrice.message as string}
                  </p>
                )}
              </div>

              {/* Stock */}
              <div className="mt-2">
                {/*  */}
                <Input
                  type="number"
                  label={
                    <>
                      Stock <span className="text-red-600">*</span>
                    </>
                  }
                  placeholder="100"
                  {...register("stock", {
                    required: "Stock is required!",
                    valueAsNumber: true,
                    min: { value: 1, message: "Stock must be at least 1" },
                    max: {
                      value: 1000,
                      message: "Stock cannot exceed 1,000",
                    },
                    validate: (value) => {
                      if (isNaN(value)) return "Only numbers are allowed!";
                      if (!Number.isInteger(value))
                        return "Stock must be a whole number!";
                      return true;
                    },
                  })}
                />

                {/*  */}
                {errors.stock && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.stock.message as string}
                  </span>
                )}
              </div>

              {/* Size selector */}
              <div className="mt-2">
                <SizeSelector control={control} errors={errors} />
              </div>

              {/* Discount codes */}
              <div className="mt-3">
                <label className="block font-semibold text-gray-300 mb-1">
                  Select Discount Codes (optional)
                </label>

                {discountLoading ? (
                  <p className="text-gray-400">Loading discount codes...</p>
                ) : codes?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {codes?.map((code: any) => (
                      <button
                        key={code.id}
                        type="button"
                        className={`px-3 py-1 rounded-md text-sm font-semibold border ${
                          watch("discountCodes")?.includes(code.id)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                        }`}
                        onClick={() => {
                          const currentSelection = watch("discountCodes") || [];
                          const updatedSelection = currentSelection?.includes(
                            code.id,
                          )
                            ? currentSelection.filter(
                                (id: string) => id !== code.id,
                              )
                            : [...currentSelection, code.id];
                          setValue("discountCodes", updatedSelection);
                        }}
                      >
                        {code.publicName} ({code.discountValue})
                        {code.discountType === "percentage" ? "%" : "₹"}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*  */}
      {openImageModal && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-[450px] text-white">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 mb-4">
              {/*  */}
              <h2 className="text-lg font-semibold">Enhance Product Image</h2>

              {/*  */}
              <X
                size={20}
                className="cursor-pointer"
                onClick={() => setOpenImageModal(!openImageModal)}
              />
            </div>

            {/* Image Rendering for enhancements */}
            <div className="w-full h-[250px] relative rounded-md overflow-hidden border border-gray-600">
              {selectedImage && (
                <Image
                  src={getTransformedImage()}
                  alt="product-image"
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>

            {/*  */}
            {selectedImage && (
              <div className="mt-4 space-y-2">
                {/*  */}
                <div className="flex justify-between items-center mt-4">
                  {/*  */}
                  <h3 className="text-white text-sm font-semibold">
                    AI Enhancements
                  </h3>

                  {/*  */}
                  <button
                    type="button"
                    onClick={() => setActiveEffects([])}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Reset
                  </button>
                </div>

                {/*  */}
                <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto">
                  {enhancements?.map(({ label, effect }) => (
                    <button
                      key={effect}
                      className={`p-2 rounded-md flex items-center gap-2 ${
                        activeEffects.includes(effect)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                      onClick={() => applyTransformation(effect)}
                      disabled={processing}
                    >
                      <Wand size={18} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Server error */}
      <div className="w-full text-center mt-2">
        {serverError && (
          <span className="text-red-500 text-sm text-center mt-2 font-medium">
            {serverError}
          </span>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-6 flex justify-end gap-3">
        {/* Save draft button */}
        {isChanged && (
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-gray-700 text-white rounded-md transition-colors duration-200 hover:bg-gray-600 hover:scale-[1.02]"
          >
            Save Draft
          </button>
        )}

        {/* Create product button */}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md transition-all duration-200 hover:bg-blue-500 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
};

export default Page;
