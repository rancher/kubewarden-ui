import { shallowMount, Wrapper } from '@vue/test-utils';
import CruVexHub from '../sbomscanner.kubewarden.io.vexhub.vue';

jest.mock('@shell/mixins/create-edit-view', () => ({
  props: {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:    String,
      default: 'create'
    }
  },
  methods: {
    save: jest.fn(),
    done: jest.fn(),
  },
  computed: {
    doneRoute() {
      return 'some-route';
    }
  }
}));

const mockT = jest.fn((key) => key);

describe('Component: CruVexHub', () => {
  let wrapper: Wrapper<InstanceType<typeof CruVexHub>>;

  const defaultProps = {
    value: {
      metadata: { name: 'test-vex' },
      spec:     {
        url:     'https://example.com/vex.json',
        enabled: true
      }
    },
    mode: 'create'
  };

  const createWrapper = (propsData: any = {}, options: any = {}) => {
    const props = {
      ...JSON.parse(JSON.stringify(defaultProps)),
      ...propsData,
    };

    return shallowMount(CruVexHub, {
      propsData: props,
      global:    {
        mocks: { t: mockT },
        stubs: {
          CruResource: {
            name:     'CruResource',
            template: '<div><slot /></div>',
            props:    ['doneRoute', 'mode', 'resource', 'subtypes', 'validationPassed', 'errors', 'cancelEvent']
          },
          NameNsDescription: true,
          LabeledInput:      true,
          Checkbox:          true
        }
      },
      ...options,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    wrapper = createWrapper();
  });

  it('should mount correctly', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should initialize spec if it does not exist on value', () => {
    const wrapperWithNoSpec = createWrapper({ value: { metadata: { name: 'test-no-spec' } } });

    const vm = wrapperWithNoSpec.vm as any;

    expect(vm.value.spec).toBeDefined();
    expect(vm.value.spec.url).toBe('');
    expect(vm.value.spec.enabled).toBe(true);
  });

  it('should render a LabeledInput for the URL', () => {
    const input = wrapper.findComponent({ name: 'LabeledInput' });

    expect(input.exists()).toBe(true);
    expect(input.props('value')).toBe(defaultProps.value.spec.url);
    expect(input.props('label')).toBe('imageScanner.vexManagement.cru.uri.label');
    expect(input.props('required')).toBe(true);
  });

  it('should render a Checkbox for enabling the scanner', () => {
    const checkbox = wrapper.findComponent({ name: 'Checkbox' });

    expect(checkbox.exists()).toBe(true);
    expect(checkbox.props('value')).toBe(defaultProps.value.spec.enabled);
    expect(checkbox.props('labelKey')).toBe('imageScanner.vexManagement.cru.enable.label');
  });

  it('should pass correct props to NameNsDescription', () => {
    const nameNs = wrapper.findComponent({ name: 'NameNsDescription' });

    expect(nameNs.exists()).toBe(true);
    expect(nameNs.props('value')).toEqual(defaultProps.value);
    expect(nameNs.props('namespaced')).toBe(false);
  });

  it('should pass correct props to CruResource', () => {
    const cru = wrapper.findComponent({ name: 'CruResource' });

    expect(cru.exists()).toBe(true);
    expect(cru.props('resource')).toEqual(defaultProps.value);
    expect(cru.props('validationPassed')).toBe(true);
  });
});
