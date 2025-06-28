<template>
  <svg
    class="svg-loading"
    viewBox="0 0 50 50"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      class="path"
      cx="25"
      cy="25"
      r="20"
      fill="none"
      stroke="currentColor"
      stroke-width="4"
    ></circle>
  </svg>
</template>

<style scoped>
.svg-loading {
  width: 1em;
  height: 1em;
  animation: rotate 2s linear infinite;
}

.path {
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
</style>
