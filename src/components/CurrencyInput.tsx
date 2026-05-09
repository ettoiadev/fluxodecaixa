import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value = 0, onChange, placeholder = "0,00", className, ...props }, ref
) => {
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocusedRef = useRef(false);
  const digitsRef = useRef('');

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const digitsToNumber = (digits: string) => {
    const cents = digits ? parseInt(digits, 10) : 0;
    return Number.isFinite(cents) ? cents / 100 : 0;
  };

  const numberToDigits = (num: number) => {
    const cents = Math.round((Number.isFinite(num) ? num : 0) * 100);
    return String(Math.max(0, cents));
  };

  const syncFromNumber = (num: number) => {
    const digits = numberToDigits(num);
    digitsRef.current = digits;
    setDisplayValue(formatCurrency(digitsToNumber(digits)));
  };

  useEffect(() => {
    if (isFocusedRef.current) return;
    syncFromNumber(value);
  }, [value]);

  const setCaretToEnd = () => {
    const el = inputRef.current;
    if (!el) return;
    const len = el.value.length;
    try {
      el.setSelectionRange(len, len);
    } catch {
      // ignore
    }
  };

  const applyDigits = (nextDigits: string) => {
    const normalized = nextDigits.replace(/^0+(?=\d)/, '');
    digitsRef.current = normalized;
    const numeric = digitsToNumber(normalized);
    setDisplayValue(formatCurrency(numeric));
    onChange?.(numeric);
    requestAnimationFrame(setCaretToEnd);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const onlyDigits = raw.replace(/\D/g, '');
    applyDigits(onlyDigits);
  };

  // Manipular teclas especiais
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir: backspace, delete, tab, escape, enter
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'];
    
    if (allowedKeys.includes(e.key)) {
      return;
    }

    // Permitir: setas, home, end
    const navigationKeys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (navigationKeys.includes(e.key)) {
      return;
    }

    // Permitir apenas números, vírgula e ponto
    if (!/[0-9,.,]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  // Manipular foco para selecionar todo
  const handleFocus = () => {
    isFocusedRef.current = true;
    requestAnimationFrame(setCaretToEnd);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    syncFromNumber(digitsToNumber(digitsRef.current));
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn(
        "font-mono tabular-nums",
        className
      )}
      {...props}
    />
  );
});

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;
