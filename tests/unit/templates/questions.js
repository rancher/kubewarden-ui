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

export const deepSequenceQuestion = {
  default:            [],
  description:        '',
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

export const deepMapQuestion =
    {
      default:      {},
      description:  '',
      group:        'Settings',
      label:        'Run as user',
      hide_input:   true,
      type:         'map[',
      variable:     'run_as_user',
      subquestions: [
        {
          default: 'MustRunAs',
          group:   'Settings',
          label:   'Rule',
          options: [
            'MustRunAs',
            'MustRunAsNonRoot',
            'RunAsAny'
          ],
          type:     'enum',
          variable: 'run_as_user.rule'
        },
        {
          default:  false,
          group:    'Settings',
          label:    'Overwrite',
          show_if:  'run_as_user.rule=MustRunAs',
          title:    'Overwrite',
          type:     'boolean',
          variable: 'run_as_user.overwrite'
        },
        {
          default:            [],
          description:        '',
          group:              'Settings',
          label:              'Ranges',
          show_if:            'run_as_user.rule=MustRunAs||run_as_user.rule=MustRunAsNonRoot',
          hide_input:         true,
          type:               'sequence[',
          variable:           'run_as_user.ranges',
          sequence_questions: [
            {
              default:  0,
              group:    'Settings',
              label:    'min',
              show_if:  'run_as_user.rule=MustRunAs||run_as_user.rule=MustRunAsNonRoot',
              type:     'int',
              variable: 'min'
            },
            {
              default:  0,
              group:    'Settings',
              label:    'max',
              show_if:  'run_as_user.rule=MustRunAs||run_as_user.rule=MustRunAsNonRoot',
              type:     'int',
              variable: 'max'
            }
          ]
        }
      ]
    };
