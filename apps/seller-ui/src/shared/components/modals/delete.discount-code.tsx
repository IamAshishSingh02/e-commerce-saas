import { X } from 'lucide-react'

const DeleteDiscountCodeModal = ({discount, onClose, onConfirm}: {discount: any, onClose: () => void, onConfirm: () => void}) => {
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-[450px] shadow-lg">

        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-gray-700 pb-3">

          {/* Heading */}
          <h3>Delete Discount Code</h3>

          {/* Cancel button */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={22} />
          </button>

        </div>

        {/* Warning message */}
        <p className="text-gray-300 mt-4 text-center text-sm leading-relaxed">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-white">
            {discount.publicName}
          </span>
          ?
          <br />
          <span className="text-red-400 text-xs mt-2 text-center">This action cannot be undone.</span>
        </p>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mt-6">

          {/* cancel button */}
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-white transition"
          >
            Cancel
          </button>

          {/* delete button */}
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-white font-semibold transition"
          >
            Delete
          </button>
          
        </div>

      </div>
    </div>
  )
}

export default DeleteDiscountCodeModal