import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;

        return (
          <div key={i} className="flex items-center">
            {/* Step */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 font-display text-sm font-bold transition-all duration-300 sm:h-10 sm:w-10",
                  isCompleted &&
                    "border-sage-400 bg-sage-400 text-white",
                  isActive &&
                    "border-accent bg-accent text-white",
                  !isCompleted &&
                    !isActive &&
                    "border-cream-300 bg-white text-brown-400"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-[10px] font-semibold transition-colors sm:text-xs",
                    isActive ? "text-accent" : "text-brown-400"
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1 mb-5 h-0.5 w-5 transition-colors duration-300 sm:mx-2 sm:w-16 md:w-20",
                  i < currentStep ? "bg-sage-400" : "bg-cream-300"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
