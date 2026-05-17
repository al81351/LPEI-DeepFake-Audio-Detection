"use client"

import React from "react"
import { Mic } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/utils"

interface VoiceInputProps {
  onStart?: () => void
  onStop?: () => void
  isActive?: boolean
}

export function VoiceInput({
  className,
  onStart,
  onStop,
  isActive,
}: React.ComponentProps<"div"> & VoiceInputProps) {
  const [_listening, _setListening] = React.useState<boolean>(false)
  const [_time, _setTime] = React.useState<number>(0)

  // Sync with external isActive prop
  React.useEffect(() => {
    if (isActive !== undefined) {
      _setListening(isActive)
    }
  }, [isActive])

  React.useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>

    if (_listening) {
      onStart?.()
      intervalId = setInterval(() => {
        _setTime((t) => t + 1)
      }, 1000)
    } else {
      onStop?.()
      _setTime(0)
    }

    return () => clearInterval(intervalId)
  }, [_listening])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const onClickHandler = () => {
    _setListening(!_listening)
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <motion.div
        className="flex p-3 items-center justify-center rounded-full cursor-pointer"
        layout
        transition={{ layout: { duration: 0.4 } }}
        onClick={onClickHandler}
        style={{
          border: `1px solid ${_listening ? 'oklch(70% 0.18 250 / 0.4)' : 'rgba(255,255,255,0.12)'}`,
          background: _listening
            ? 'oklch(70% 0.18 250 / 0.1)'
            : 'rgba(255,255,255,0.04)',
          boxShadow: _listening ? '0 0 24px oklch(70% 0.18 250 / 0.2)' : 'none',
          transition: 'border-color 300ms, background 300ms, box-shadow 300ms',
        }}
      >
        <div className="h-7 w-7 items-center justify-center flex">
          {_listening ? (
            <motion.div
              className="w-4 h-4 rounded-sm"
              style={{ background: 'var(--color-danger)' }}
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : (
            <Mic style={{ color: 'rgba(255,255,255,0.6)', width: 20, height: 20 }} />
          )}
        </div>
        <AnimatePresence mode="wait">
          {_listening && (
            <motion.div
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: "auto", marginLeft: 12 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden flex gap-3 items-center justify-center"
            >
              {/* Frequency bars */}
              <div className="flex gap-0.5 items-center justify-center">
                {[...Array(14)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 rounded-full"
                    style={{ background: 'var(--color-accent)' }}
                    initial={{ height: 2 }}
                    animate={{
                      height: _listening
                        ? [2, 4 + Math.random() * 14, 3 + Math.random() * 8, 2]
                        : 2,
                    }}
                    transition={{
                      duration: _listening ? 0.8 + Math.random() * 0.4 : 0.3,
                      repeat: _listening ? Infinity : 0,
                      delay: _listening ? i * 0.06 : 0,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
              {/* Timer */}
              <div
                className="text-xs font-mono w-10 text-center tabular"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                {formatTime(_time)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Label below */}
      <div
        className="mt-3 text-xs font-mono tracking-widest uppercase"
        style={{ color: _listening ? 'var(--color-accent)' : 'rgba(255,255,255,0.25)' }}
      >
        {_listening ? 'A capturar' : 'Clique para iniciar'}
      </div>
    </div>
  )
}
