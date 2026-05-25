export const authAppearance = {
  variables: {
    colorPrimary:       'oklch(50% 0.18 155)',
    colorBackground:      'transparent',
    colorInputBackground: 'oklch(98.5% 0.005 220)',
    colorInputText:     'oklch(16% 0.014 222)',
    colorText:          'oklch(16% 0.014 222)',
    colorTextSecondary: 'oklch(48% 0.012 218)',
    colorDanger:        'oklch(48% 0.20 25)',
    borderRadius:       '7px',
    fontFamily:         '"Poppins", system-ui, sans-serif',
    fontSize:           '14px',
    spacingUnit:        '16px',
  },
  elements: {
    // --- Container (refuerzo via appearance; el fix real está en globals.css .cl-*) ---
    card: {
      boxShadow:       'none',
      padding:         '0',
      backgroundColor: 'transparent',
      border:          'none',
      width:           '100%',
      maxWidth:        'none',
    },
    cardBox: {
      boxShadow: 'none',
      border:    'none',
      width:     '100%',
      maxWidth:  'none',
    },
    rootBox: {
      width: '100%',
    },

    // --- Header: hidden — we render our own ---
    header:         { display: 'none' },
    headerTitle:    { display: 'none' },
    headerSubtitle: { display: 'none' },

    // --- Social buttons ---
    socialButtonsBlockButton: {
      border:          '1px solid oklch(80% 0.018 222)',
      borderRadius:    '7px',
      backgroundColor: 'oklch(98.5% 0.005 220)',
      color:           'oklch(16% 0.014 222)',
      fontSize:        '14px',
      fontWeight:      '500',
      padding:         '10px 16px',
      transition:      'background-color 150ms ease-out, border-color 150ms ease-out',
    },
    socialButtonsBlockButtonText: {
      fontSize:   '14px',
      fontWeight: '500',
      color:      'oklch(16% 0.014 222)',
    },

    // --- Divider ---
    dividerLine: {
      backgroundColor: 'oklch(86% 0.016 222)',
    },
    dividerText: {
      color:      'oklch(48% 0.012 218)',
      fontSize:   '12px',
      fontWeight: '500',
    },

    // --- Form fields ---
    formFieldLabel: {
      color:        'oklch(16% 0.014 222)',
      fontSize:     '14px',
      fontWeight:   '500',
      marginBottom: '6px',
    },
    formFieldInput: {
      border:          '1px solid oklch(80% 0.018 222)',
      borderRadius:    '7px',
      backgroundColor: 'oklch(98.5% 0.005 220)',
      color:           'oklch(16% 0.014 222)',
      fontSize:        '14px',
      padding:         '10px 12px',
      transition:      'border-color 150ms ease-out',
      outline:         'none',
    },
    formFieldInputShowPasswordButton: {
      color: 'oklch(48% 0.012 218)',
    },

    // --- Primary button ---
    formButtonPrimary: {
      backgroundColor: 'oklch(50% 0.18 155)',
      color:           'oklch(98% 0.004 155)',
      borderRadius:    '7px',
      fontSize:        '14px',
      fontWeight:      '500',
      padding:         '10px 20px',
      boxShadow:       'none',
      transition:      'background-color 150ms ease-out',
      border:          'none',
    },

    // --- Footer links ---
    footerActionText: {
      color:    'oklch(48% 0.012 218)',
      fontSize: '14px',
    },
    footerActionLink: {
      color:      'oklch(50% 0.18 155)',
      fontWeight: '500',
      fontSize:   '14px',
    },

    // --- Error messages ---
    formFieldErrorText: {
      color:    'oklch(48% 0.20 25)',
      fontSize: '12px',
    },
    alertText: {
      fontSize: '14px',
    },

    // --- Internal nav links (forgot password, etc.) ---
    formFieldAction: {
      color:      'oklch(50% 0.18 155)',
      fontWeight: '500',
      fontSize:   '12px',
    },

    // --- OTP input (if used) ---
    otpCodeField: {
      gap: '8px',
    },
    otpCodeFieldInput: {
      border:          '1px solid oklch(86% 0.016 222)',
      borderRadius:    '7px',
      backgroundColor: 'oklch(97% 0.010 220)',
      color:           'oklch(16% 0.014 222)',
      fontSize:        '20px',
      fontWeight:      '600',
    },
  },
}
