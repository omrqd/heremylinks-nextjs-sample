import React from 'react';
import styles from '../login.module.css';

interface VerificationFormProps {
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  onVerify: () => void;
  onResend: () => Promise<void>;
  isLoading: boolean;
  canResend?: boolean;
  countdown?: number;
}

const VerificationForm: React.FC<VerificationFormProps> = ({ 
  verificationCode, 
  setVerificationCode,
  onVerify, 
  onResend,
  isLoading,
  canResend = true,
  countdown = 0
}) => {
  return (
    <div className={styles.verificationContainer}>
      <p className={styles.verificationText}>
        We've sent a verification code to your email. 
        Please enter the code below to verify your account.
      </p>
      
      <div className={styles.inputGroup}>
        <input
          type="text"
          placeholder="Enter 6-digit code"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          className={styles.input}
          maxLength={6}
        />
      </div>
      
      <button 
        className={styles.button}
        onClick={onVerify} 
        disabled={verificationCode.length !== 6 || isLoading}
      >
        {isLoading ? 'Verifying...' : 'Verify Email'}
      </button>
      
      <div className={styles.resendContainer}>
        <button 
          type="button"
          className={styles.resendButton}
          onClick={onResend}
          disabled={isLoading || !canResend}
        >
          {!canResend && countdown > 0 
            ? `Resend code in ${countdown}s` 
            : 'Resend verification code'}
        </button>
      </div>
    </div>
  );
};

export default VerificationForm;