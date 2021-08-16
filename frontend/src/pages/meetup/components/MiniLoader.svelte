<script lang='ts'></script>

<div class='loading-bar'></div>

<style>
  .loading-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 5%;
    height: 6px;

    background: rgb(0,190,255);


    -webkit-animation: Loading 3s infinite;
    -moz-animation: Loading 3s infinite;
    animation: Loading 3s infinite;
  }

  @keyframes Loading {
      0%{ width: 5%; left: 0 }
      50% { left: 10%; width: 60%; }
      100%{ left: 100%; width: 5%; }
  }
</style>