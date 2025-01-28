<script>
import Jexl from 'jexl';
import jsyaml from 'js-yaml';
import Tab from '@shell/components/Tabbed/Tab';
import { get, set } from '@shell/utils/object';
import { sortBy, camelCase } from 'lodash';
import { _EDIT } from '@shell/config/query-params';
import BooleanType from '@shell/components/Questions/Boolean';
// import EnumType from '@shell/components/Questions/Enum';
import IntType from '@shell/components/Questions/Int';
import FloatType from '@shell/components/Questions/Float';
import ReferenceType from '@shell/components/Questions/Reference';
import CloudCredentialType from '@shell/components/Questions/CloudCredential';

/*
  Replacing these components for added functionality
*/
import ArrayType from './Array';
import EnumType from './Enum';
import MapType from './QuestionMap';
import StringType from './String';
import SequenceType from './SequenceTree';

export const knownTypes = {
  string:          StringType,
  hostname:        StringType, // @TODO
  multiline:       StringType,
  password:        StringType,
  boolean:         BooleanType,
  enum:            EnumType,
  int:             IntType,
  float:           FloatType,
  questionMap:     MapType,
  reference:       ReferenceType,
  configmap:       ReferenceType,
  secret:          ReferenceType,
  storageclass:    ReferenceType,
  pvc:             ReferenceType,
  cloudcredential: CloudCredentialType,
};

export function componentForQuestion(q) {
  const type = (q.type || '').toLowerCase();

  if ( knownTypes[type] ) {
    return type;
  } else if ( type.startsWith('array[') ) { // This only really works for array[string|multiline], but close enough for now.
    return ArrayType;
  } else if ( type.startsWith('map[') ) { // Same, only works with map[string|multiline]
    return MapType;
  } else if ( type.startsWith('reference[') ) { // Same, only works with map[string|multiline]
    return ReferenceType;
  } else if ( type.startsWith('sequence[') ) {
    return SequenceType;
  }

  return 'string';
}

export function schemaToQuestions(fields) {
  const keys = Object.keys(fields);
  const out = [];

  for ( const k of keys ) {
    out.push({
      variable: k,
      label:    k,
      ...fields[k],
    });
  }

  return out;
}

function migrate(expr) {
  let out;

  if ( expr.includes('||') ) {
    out = expr.split('||').map(x => migrate(x)).join(' || ');
  } else if ( expr.includes('&&') ) {
    out = expr.split('&&').map(x => migrate(x)).join(' && ');
  } else {
    const parts = expr.match(/^(.*)(!?=)(.*)$/);

    if ( parts ) {
      const key = parts[1].trim();
      const op = parts[2].trim() === '!=' ? '!=' : '==';
      const val = parts[3].trim();

      if ( val === 'true' || val === 'false' || val === 'null' ) {
        out = `${ key } ${ op } ${ val }`;
      } else if ( val === '' ) {
        // Existing charts expect `foo=` with `{foo: null}` to be true.
        if ( op === '!=' ) {
          out = `!!${ key }`;
        } else {
          out = `!${ key }`;
        }
        // out = `${ op === '!' ? '!' : '' }(${ key } == "" || ${ key } == null)`;
      } else {
        out = `${ key } ${ op } "${ val }"`;
      }
    } else {
      try {
        Jexl.compile(expr);

        out = expr;
      } catch (e) {
        console.error('Error migrating expression:', expr); // eslint-disable-line no-console

        out = 'true';
      }
    }
  }

  return out;
}

export default {
  components: { Tab, ...knownTypes },

  props: {
    mode: {
      type:    String,
      default: _EDIT,
    },

    value: {
      type:     Object,
      required: true,
    },

    tabbed: {
      type:    [Boolean, String],
      default: true,
    },

    // Can be a chartVersion, resource Schema, or an Array of question objects
    source: {
      type:     [Object, Array],
      required: true,
    },

    targetNamespace: {
      type:     String,
      required: true
    },

    ignoreVariables: {
      type:    Array,
      default: () => [],
    },

    disabled: {
      type:    Boolean,
      default: false,
    },

    inStore: {
      type:    String,
      default: 'cluster'
    },

    emit: {
      type:    Boolean,
      default: false,
    }
  },

  data() {
    return { valueGeneration: 0 };
  },

  computed: {
    allQuestions() {
      if ( this.source.questions?.questions ) {
        return this.source.questions.questions;
      } else if ( this.source.type === 'schema' && this.source.resourceFields ) {
        return schemaToQuestions(this.source.resourceFields);
      } else if ( typeof this.source === 'object' ) {
        return schemaToQuestions(this.source);
      } else {
        return [];
      }
    },

    shownQuestions() {
      const values = this.value;
      const vm = this;

      if ( this.valueGeneration < 0 ) {
        // Pointless condition to get this to depend on generation and recompute
        return;
      }

      const out = [];

      for ( const q of this.allQuestions ) {
        if ( this.ignoreVariables.includes(q.variable) ) {
          continue;
        }

        addQuestion(q);
      }

      return out;

      function addQuestion(q, depth = 1, parentGroup) {
        if ( !vm.shouldShow(q, values) ) {
          return;
        }

        q.depth = depth;
        q.group = q.group || parentGroup;

        out.push(q);

        if ( q.subquestions?.length && vm.shouldShowSub(q, values) ) {
          for ( const sub of q.subquestions ) {
            addQuestion(sub, depth + 1, q.group);
          }
        }
      }
    },

    chartName() {
      return this.source.chart?.name;
    },

    groups() {
      const map = {};
      const defaultGroup = 'Questions';
      let weight = this.shownQuestions.length;

      for ( const q of this.shownQuestions ) {
        if ( q.type?.startsWith('map[') && q.group === undefined ) {
          const subWithGroup = q.subquestions.find(sub => sub.group);

          q.group = subWithGroup.group;
        }

        const group = q.group || defaultGroup;

        const normalized = group.trim().toLowerCase();
        const name = this.$store.getters['i18n/withFallback'](`charts.${ this.chartName }.group.${ camelCase(group) }`, null, group);

        if ( !map[normalized] ) {
          map[normalized] = {
            name,
            questions: [],
            weight:    weight--,
          };
        }

        map[normalized].questions.push(q);
      }

      const out = Object.values(map);

      return sortBy(out, 'weight:desc');
    },

    asTabs() {
      if ( this.tabbed === false || this.tabbed === 'never' ) {
        return false;
      }

      if ( this.tabbed === 'multiple' ) {
        return this.groups.length > 1;
      }

      return true;
    },
  },

  watch: {
    value: {
      deep: true,

      handler() {
        this.valueGeneration++;
      },
    }
  },

  methods: {
    get,
    set,
    componentForQuestion,

    update(variable, $event) {
      console.log('## questions update variable: ', variable, '  || event: ', $event);
      set(this.value, variable, $event);
      if (this.emit) {
        this.$emit('updated');
      }
    },

    updateSequence(e) {
      const {
        question, variable, index, event
      } = e;

      const questionValue = this.value[question.variable];
      const nestedValue = this.getProperty(this.value, question.variable);

      if (nestedValue) {
        nestedValue[index][variable] = event;
      } else if (questionValue) {
        questionValue[index][variable] = event;
      } else {
        // Handle the case where both nestedValue and questionValue are undefined
        console.warn(`Unable to update sequence for question variable: ${ question.variable }`);
      }

      if (this.emit) {
        this.$emit('updated');
      }
    },

    updateSequenceDeep(event) {
      const {
        rootQuestion, deepQuestion, valuesYaml, index
      } = event;
      const valuesObj = jsyaml.load(valuesYaml);

      if ( valuesObj ) {
        this.value[rootQuestion][index][deepQuestion] = valuesObj[deepQuestion];
      }
    },

    addSequence($event) {
      const out = {};

      for ( const value of Object.values($event.sequence_questions) ) {
        Object.assign(out, { [value.variable]: value.default });
      }

      if ( Array.isArray($event.default) ) {
        if ( !this.value[$event.variable] && !$event.variable.includes('.') ) {
          this.value[$event.variable] = [];
        }
        /*
          If the sequence is nested within a subquestion, the $event.variable will
          be a dot notation representation.
        */
        if ( $event.variable.includes('.') ) {
          const deepProp = this.getProperty(this.value, $event.variable);
          const shouldAssign = $event.type === 'sequence[';

          if ( deepProp ) {
            return deepProp.push(out);
          }

          if ( shouldAssign ) {
            const parts = $event.variable.split('.');
            const root = this.value[parts[0]];
            const prop = parts[1];

            if ( root ) {
              root[prop] = [];

              return root[prop].push(out);
            }
          }
        }

        this.value[$event.variable].push(out);
      }

      if ( this.emit ) {
        this.$emit('updated');
      }
    },

    removeSequence($event) {
      const deepProp = this.getProperty(this.value, $event.question.variable);

      if ( deepProp ) {
        deepProp.splice($event.vIndex, 1);
      } else {
        this.value?.[$event.question.variable].splice($event.vIndex, 1);
      }

      if ( this.emit ) {
        this.$emit('updated');
      }
    },

    resetSequence($event) {
      this.value[$event.variable] = $event.default;
    },

    /** Remove properties from this.value that only appear when an Enum condition is met */
    enumUpdate($event, question) {
      const values = this.value;

      let match;

      // Find the matching question related to the Enum
      for ( const q of this.allQuestions ) {
        if ( question.variable.includes(q.variable) ) {
          match = q;
        }
      }

      // Remove the properties from this.value
      if ( match && match.type.startsWith('map[') ) {
        const subProperties = match.subquestions.map(sub => sub.variable);

        this.removeProperties(values, subProperties);
      }
    },

    /** Delete the properties from an object by supplying the question variable dot notation strings */
    removeProperties(values, propertyNames) {
      propertyNames.forEach((propertyName) => {
        const keys = propertyName.split('.');
        let obj = values;

        for ( let i = 0; i < keys.length - 1; i++ ) {
          if ( keys[i] in obj ) {
            obj = obj[keys[i]];
          } else {
            return; // Property does not exist, no need to continue
          }
        }

        delete obj[keys[keys.length - 1]];
      });

      return values;
    },

    evalExpr(expr, values, question, allQuestions) {
      try {
        const out = Jexl.evalSync(expr, values);

        // console.log('Eval', expr, '=> ', out);

        // If the variable contains a hyphen, check if it evaluates to true
        // according to the evaluation logic used in the old UI.
        // This helps users avoid manual work to migrate from legacy apps.
        if (!out && expr.includes('-')) {
          const res = this.evaluate(question, allQuestions);

          return res;
        }

        return out;
      } catch (err) {
        console.error('Error evaluating expression:', expr, values); // eslint-disable-line no-console

        return true;
      }
    },

    evaluate(question, allQuestions) {
      if ( !question.show_if ) {
        return true;
      }
      const and = question.show_if.split('&&');
      const or = question.show_if.split('||');

      let result;

      if ( get(or, 'length') > 1 ) {
        result = or.some(showIf => this.calExpression(showIf, allQuestions));
      } else {
        result = and.every(showIf => this.calExpression(showIf, allQuestions));
      }

      return result;
    },

    calExpression(showIf, allQuestions) {
      if ( showIf.includes('!=')) {
        return this.isNotEqual(showIf, allQuestions);
      } else {
        return this.isEqual(showIf, allQuestions);
      }
    },

    isEqual(showIf, allQuestions) {
      showIf = showIf.trim();
      const variables = this.getVariables(showIf, '=');

      if ( variables ) {
        const left = this.stringifyAnswer(this.getAnswer(variables.left, allQuestions));
        const right = this.stringifyAnswer(variables.right);

        return left === right;
      }

      return false;
    },

    isNotEqual(showIf, allQuestions) {
      showIf = showIf.trim();
      const variables = this.getVariables(showIf, '!=');

      if ( variables ) {
        const left = this.stringifyAnswer(this.getAnswer(variables.left, allQuestions));
        const right = this.stringifyAnswer(variables.right);

        return left !== right;
      }

      return false;
    },

    getProperty(root, prop) {
      const parts = prop.split('.');
      let value = root;

      for ( const part of parts ) {
        value = value[part];

        if ( value === undefined ) {
          return;
        }
      }

      return value;
    },

    getVariables(showIf, operator) {
      if ( showIf.includes(operator)) {
        const array = showIf.split(operator);

        if ( array.length === 2 ) {
          return {
            left:  array[0],
            right: array[1]
          };
        } else {
          return null;
        }
      }

      return null;
    },

    getAnswer(variable, questions) {
      const found = questions.find(q => q.variable === variable);

      if ( found ) {
        // Equivalent to finding question.answer in Ember
        return get(this.value, found.variable);
      } else {
        return variable;
      }
    },

    stringifyAnswer(answer) {
      if ( answer === undefined || answer === null ) {
        return '';
      } else if ( typeof answer === 'string' ) {
        return answer;
      } else {
        return `${ answer }`;
      }
    },

    shouldShow(q, values) {
      let expr = q.if;

      if ( expr === undefined && q.show_if !== undefined ) {
        expr = migrate(q.show_if);
      }

      if ( expr ) {
        const shown = !!this.evalExpr(expr, values, q, this.allQuestions);

        return shown;
      }

      return true;
    },

    shouldShowSub(q, values) {
      // Sigh, both singular and plural are used in the wild...
      let expr = ( q.subquestions_if === undefined ? q.subquestion_if : q.subquestions_if);
      const old = ( q.show_subquestions_if === undefined ? q.show_subquestion_if : q.show_subquestions_if);

      if ( !expr && old !== undefined ) {
        if ( old === false || old === 'false' ) {
          expr = `!${ q.variable }`;
        } else if ( old === true || old === 'true' ) {
          expr = `!!${ q.variable }`;
        } else {
          expr = `${ q.variable } == "${ old }"`;
        }
      }

      if ( expr ) {
        return this.evalExpr(expr, values, q, this.allQuestions);
      }

      return true;
    }
  },
};
</script>

<template>
  <form v-if="asTabs">
    <Tab
      v-for="g in groups"
      :key="g.name"
      :name="g.name"
      :label="g.name"
      :weight="g.weight"
    >
      <div
        v-for="q in g.questions"
        :key="q.variable"
        class="row question"
      >
        <div class="col span-12">
          <component
            :is="componentForQuestion(q)"
            :in-store="inStore"
            :question="q"
            :target-namespace="targetNamespace"
            :value="get(value, q.variable)"
            :mode="mode"
            :disabled="disabled"
            :chart-name="chartName"
            @update:value="update(q.variable, $event)"
            @seqInput="updateSequence($event)"
            @seqInputDeep="updateSequenceDeep($event)"
            @addSeq="addSequence($event)"
            @removeSeq="removeSequence($event)"
            @resetSeq="resetSequence($event)"
            @enumUpdate="enumUpdate($event)"
          />
        </div>
      </div>
    </Tab>
  </form>
  <form v-else>
    <div
      v-for="g in groups"
      :key="g.name"
    >
      <h3 v-if="groups.length > 1">
        {{ g.label }}
      </h3>
      <div
        v-for="q in g.questions"
        :key="q.variable"
        class="row question"
      >
        <div class="col span-12">
          <component
            :is="componentForQuestion(q)"
            :in-store="inStore"
            :question="q"
            :target-namespace="targetNamespace"
            :mode="mode"
            :value="get(value, q.variable)"
            :disabled="disabled"
            :chart-name="chartName"
            @update:value="update(q.variable, $event)"
            @seqInput="updateSequence($event)"
            @seqInputDeep="updateSequenceDeep($event)"
            @addSeq="addSequence($event)"
            @removeSeq="removeSequence($event)"
            @resetSeq="resetSequence($event)"
            @enumUpdate="enumUpdate($event, q)"
          />
        </div>
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .question {
    margin-top: 10px;

    &:first-child {
      margin-top: 0;
    }
  }
</style>
