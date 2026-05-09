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

  // Formatar valor para exibição
  const formatDisplayValue = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  // Converter valor string formatado para número
  const parseCurrency = (str: string): number => {
    if (!str) return 0;
    
    // Remove tudo exceto números, vírgula e ponto
    const clean = str
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '') // Remove pontos (separador de milhar)
      .replace(',', '.'); // Converte vírgula para ponto (decimal)
    
    const num = parseFloat(clean);
    return Number.isFinite(num) ? num : 0;
  };

  // Atualizar display quando o valor mudar externamente
  useEffect(() => {
    setDisplayValue(formatDisplayValue(value));
  }, [value]);

  // Manipular input do usuário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Permitir apenas números, vírgula e ponto
    const regex = /^[0-9]*[.,]?[0-9]*$/;
    if (inputValue && !regex.test(inputValue)) {
      return;
    }

    // Se estiver vazio, define como 0
    if (!inputValue) {
      setDisplayValue('');
      onChange?.(0);
      return;
    }

    // Converter para número
    const numValue = parseCurrency(inputValue);
    
    // Atualizar display com formatação
    setDisplayValue(inputValue);
    onChange?.(numValue);
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
      e.preventDefault();
      return;
    }

    // Permitir apenas números, vírgula e ponto
    if (!/[0-9,.,]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  // Manipular foco para selecionar todo
  const handleFocus = () => {
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
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
