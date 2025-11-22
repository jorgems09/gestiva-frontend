import { useEffect, useRef } from 'react';
import './Ripple.css';

interface RippleProps {
  children: React.ReactNode;
  className?: string;
}

export default function Ripple({ children, className = '' }: RippleProps) {
  const rippleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = rippleRef.current;
    if (!element) return;

    const handleClick = (e: MouseEvent) => {
      const ripple = document.createElement('span');
      const rect = element.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.classList.add('ripple-effect');

      element.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    };

    element.addEventListener('click', handleClick);
    return () => element.removeEventListener('click', handleClick);
  }, []);

  return (
    <div ref={rippleRef} className={`ripple-container ${className}`}>
      {children}
    </div>
  );
}

