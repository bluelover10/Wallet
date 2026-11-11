import { useEffect, useState } from 'react';
import * as CountUpModule from 'react-countup';

// react-countup's build has a CJS/ESM interop quirk where, depending on the
// bundler, `default` can resolve to the CountUp component directly OR to a
// wrapper object of shape { default: CountUp, useCountUp }. Unwrap either
// shape so this always ends up with the actual component.
const CountUp =
  typeof CountUpModule.default === 'function'
    ? CountUpModule.default
    : CountUpModule.default?.default;

/**
 * Animated numeral for stat cards and totals. Wraps react-countup with
 * this app's conventions: tabular figures, currency prefix support, and
 * a short duration so it reads as a polish detail, not a distraction.
 *
 * Respects prefers-reduced-motion via live media query listener.
 */
const useReducedMotion = () => {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
};

const StatNumber = ({ value = 0, prefix = '', suffix = '', decimals = 0, duration = 1.1, className = '' }) => {
  const numericValue = Number(value) || 0;
  const reducedMotion = useReducedMotion();

  if (reducedMotion || typeof CountUp !== 'function') {
    return (
      <span className={`font-numeric ${className}`}>
        {prefix}
        {numericValue.toLocaleString(undefined, { maximumFractionDigits: decimals })}
        {suffix}
      </span>
    );
  }

  return (
    <CountUp
      end={numericValue}
      duration={duration}
      separator=","
      decimals={decimals}
      prefix={prefix}
      suffix={suffix}
      className={`font-numeric ${className}`}
      preserveValue
    />
  );
};

export default StatNumber;
