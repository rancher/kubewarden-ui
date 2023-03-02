export const question = {
  default:            [],
  tooltip:            'Valid user ID (UID) ranges for the fsGroup.',
  group:              'Settings',
  label:              'User ID Ranges',
  type:               'sequence[',
  variable:           'ranges',
  sequence_questions: [
    {
      default:  1000,
      tooltip:  'Minimum UID range for fsgroup.',
      group:    'Settings',
      label:    'min',
      type:     'int',
      variable: 'min',
    },
  ],
};

export const deepQuestion = {
  default:     [],
  description:
    'Keyless subject prefix. It will verify that the issuer and that the urlPrefix is sanitized to prevent typosquatting.',
  label:              'Keyless Subject Prefix',
  type:               'sequence[',
  variable:           'signatures',
  sequence_questions: [
    {
      default:  '',
      group:    'Settings',
      label:    'Image',
      type:     'string',
      variable: 'image',
      required: true,
    },
    {
      default:            [],
      group:              'Settings',
      label:              'Keyless Prefix',
      type:               'sequence[',
      variable:           'keylessPrefix',
      hide_input:         true,
      sequence_questions: [
        {
          default:  '',
          group:    'Settings',
          label:    'Issuer',
          type:     'string',
          required: true,
          variable: 'issuer',
        },
        {
          default:  '',
          group:    'Settings',
          label:    'URL Prefix',
          type:     'string',
          variable: 'urlPrefix',
        },
      ],
    },
  ],
};
