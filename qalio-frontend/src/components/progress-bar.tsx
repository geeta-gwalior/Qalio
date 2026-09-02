type ProgressBarProps = {
    currentStep: number
    steps: {
      id: number
      name: string
    }[]
  }
  
  export function ProgressBar({ currentStep, steps }: ProgressBarProps) {
    // Calculate progress percentage
    const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100
  
    return (
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  step.id <= currentStep ? "bg-[#219CAE] text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {step.id}
              </div>
              <span className={`ml-2 text-sm font-medium ${step.id <= currentStep ? "text-gray-800" : "text-gray-600"}`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#219CAE] h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    )
  }
  