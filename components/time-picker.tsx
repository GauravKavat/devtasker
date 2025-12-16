"use client";

import * as React from "react";
import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Select time",
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [hours, setHours] = React.useState<string>(
    value ? String(value.getHours()).padStart(2, "0") : ""
  );
  const [minutes, setMinutes] = React.useState<string>(
    value ? String(value.getMinutes()).padStart(2, "0") : ""
  );

  React.useEffect(() => {
    if (value) {
      setHours(String(value.getHours()).padStart(2, "0"));
      setMinutes(String(value.getMinutes()).padStart(2, "0"));
    }
  }, [value]);

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    const num = parseInt(val);

    if (val === "" || (num >= 0 && num <= 23)) {
      setHours(val);
    }
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    const num = parseInt(val);

    if (val === "" || (num >= 0 && num <= 59)) {
      setMinutes(val);
    }
  };

  const handleHoursBlur = () => {
    if (hours && hours.length === 1) {
      setHours(hours.padStart(2, "0"));
    }
  };

  const handleMinutesBlur = () => {
    if (minutes && minutes.length === 1) {
      setMinutes(minutes.padStart(2, "0"));
    }
  };

  const handleApply = () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;

    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      const newDate = value ? new Date(value) : new Date();
      newDate.setHours(h);
      newDate.setMinutes(m);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      onChange?.(newDate);
      setOpen(false);
    }
  };

  const handleClear = () => {
    setHours("");
    setMinutes("");
    onChange?.(undefined);
    setOpen(false);
  };

  const formatTime = (date: Date): string => {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApply();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 size-4" />
          {value ? formatTime(value) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Time</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="hours" className="text-xs text-muted-foreground">
                  Hours
                </Label>
                <Input
                  id="hours"
                  type="text"
                  inputMode="numeric"
                  placeholder="HH"
                  value={hours}
                  onChange={handleHoursChange}
                  onBlur={handleHoursBlur}
                  onKeyDown={handleKeyDown}
                  className="text-center"
                  maxLength={2}
                />
              </div>
              <span className="text-xl font-semibold mt-5">:</span>
              <div className="flex-1 space-y-1">
                <Label htmlFor="minutes" className="text-xs text-muted-foreground">
                  Minutes
                </Label>
                <Input
                  id="minutes"
                  type="text"
                  inputMode="numeric"
                  placeholder="MM"
                  value={minutes}
                  onChange={handleMinutesChange}
                  onBlur={handleMinutesBlur}
                  onKeyDown={handleKeyDown}
                  className="text-center"
                  maxLength={2}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              24-hour format (00:00 - 23:59)
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={!hours || !minutes}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface TimeInputProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export function TimeInput({
  value,
  onChange,
  disabled = false,
  className,
}: TimeInputProps) {
  const [inputValue, setInputValue] = React.useState<string>(
    value ? formatTimeValue(value) : ""
  );

  function formatTimeValue(date: Date): string {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }

  React.useEffect(() => {
    if (value) {
      setInputValue(formatTimeValue(value));
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // Parse time in format HH:MM
    const match = val.match(/^(\d{1,2}):(\d{1,2})$/);
    if (match) {
      const h = parseInt(match[1]);
      const m = parseInt(match[2]);

      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        const newDate = value ? new Date(value) : new Date();
        newDate.setHours(h);
        newDate.setMinutes(m);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        onChange?.(newDate);
      }
    } else if (val === "") {
      onChange?.(undefined);
    }
  };

  const handleBlur = () => {
    if (value) {
      setInputValue(formatTimeValue(value));
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        type="text"
        placeholder="HH:MM"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className="pr-10"
      />
      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}
