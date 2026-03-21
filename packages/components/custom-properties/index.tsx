import React, { useEffect, useState, useRef } from 'react'
import { Controller } from 'react-hook-form'
import { Plus, X } from 'lucide-react'

const CustomProperties = ({control, errors}: any) => {
  const [properties, setProperties] = useState<
    {label: string, values: string[]}[]
  >([])
  const [newLabel, setNewLabel] = useState('')
  const [newValue, setNewValue] = useState('')
  const isFirstRender = useRef(true) // Move to top level

  const addProperty = () => {
    if(!newLabel.trim()) return
    setProperties([...properties, {label: newLabel, values: []}])
    setNewLabel('')
  }

  const addValue = (index: number) => {
    if(!newValue.trim()) return
    const updatedProperties = [...properties]
    updatedProperties[index].values.push(newValue)
    setProperties(updatedProperties)
    setNewValue('')
  }

  const removeProperty = (index: number) => {
    setProperties(
      properties.filter((_, i) => i !== index)
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        <Controller 
          name='customProperties'
          control={control}
          render={({field}) => {
            useEffect(() => {
              // Skip the first render to avoid initial loop
              if (isFirstRender.current) {
                isFirstRender.current = false
                return
              }
              
              field.onChange(properties)
            }, [properties])

            return(
              <div className='mt-2'>
                <label className="block font-semibold text-gray-300 mb-1">
                  Custom Properties
                </label>

                <div className="flex flex-col gap-3">
                  {/* Existing Properties */}
                  {properties.map((property, index) => (
                    <div
                      key={index} 
                      className='border border-gray-700 p-3 rounded-lg bg-gray-900' 
                    >
                      <div className='flex items-center justify-between'>
                        <span className='text-white font-medium'>
                          {property.label}
                        </span>

                        <button
                          type='button'
                          onClick={() => removeProperty(index)}
                        >
                          <X size={18} className='text-red-500' />
                        </button>
                      </div>

                      {/* Add values to property */}
                      <div className="flex items-center mt-2 gap-2">
                        <input
                          type="text"
                          className="border outline-none border-gray-700 bg-gray-800 p-2 rounded-md text-white w-full"
                          placeholder='Enter Value...'
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                        />

                        <button
                          type="button"
                          className="px-3 py-1 bg-blue-500 text-white rounded-md"
                          onClick={() => addValue(index)}
                        >
                          Add
                        </button>
                      </div>

                      {/* Show all the values */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {property.values.map((value, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-700 text-white rounded-md text-sm"
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Add a new property*/}
                  <div className='flex items-center gap-2 mt-1'>
                    <input
                      type="text"
                      className="border outline-none border-gray-700 bg-gray-800 p-2 rounded-md text-white w-full"
                      placeholder="Enter property label (e.g., Material, Warranty)"
                      value={newLabel}
                      onChange={(e: any) => setNewLabel(e.target.value)}
                    />

                    <button
                      type="button"
                      className="px-3 py-2 bg-blue-500 text-white rounded-md flex items-center gap-2"
                      onClick={addProperty}
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                </div>

                {/* Error message */}
                {errors?.customProperties && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.customProperties.message as string}
                  </span>
                )}
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}

export default CustomProperties