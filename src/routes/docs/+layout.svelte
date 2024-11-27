<script>
  import {Col, Row} from "sveltestrap";
</script>

<Row class="vw-100 vh-100" style="overflow: hidden;">
  <Col class="vw-100 vh-100" style="overflow-y: scroll; margin-left: 1em;">
    <slot />
  </Col>
</Row>