import { QVueGlobals } from "quasar";

declare module '@vue/runtime-core' {
  // provide typings for `this.$store`
  interface ComponentCustomProperties {
    $q: QVueGlobals
  }
}