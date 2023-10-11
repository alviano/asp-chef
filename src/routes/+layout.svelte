<script>
  import '../app.css';
  import { Button, Container, Offcanvas, Row } from "sveltestrap";
  import { Keybindings } from 'dumbo-svelte';
  import { privacy_policy } from '$lib/stores';
</script>

<Container fluid class="vw-100 vh-100 p-0" style="overflow: hidden;">
  <slot />
</Container>

<Keybindings />

<Offcanvas
  header="Our Cookies and Your Privacy"
  scroll
  isOpen={!$privacy_policy}
  backdrop={false}
  placement="bottom"
>
  <p>We have cookies! They are technical cookies... read more on our <a href="/privacy-policy">privacy policy</a>.</p>
  <Row class="m-3">
    <Button color="primary" on:click={() => privacy_policy.set('accepted')}>Accept and close</Button>
  </Row>
</Offcanvas>