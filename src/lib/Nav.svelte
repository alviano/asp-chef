<script>
  import {Icon, Nav, Navbar, NavbarBrand, NavItem, NavLink} from '@sveltestrap/sveltestrap';
  import Popover from "$lib/Popover.svelte";
  import {consts} from "$lib/consts";
  import {page} from '$app/state';
</script>

<Navbar color="dark" expand="md" class="navbar-dark d-print-none" dark>
  <NavbarBrand href='/' on:click={() => location.assign('/')}>
    <span class="logo">
      ASP Chef
    </span>
  </NavbarBrand>
  <Nav class="ms-auto" navbar>
    <Popover title="About">
      <div slot="value">
        <p>
          ASP Chef is a simple, intuitive web app for analysing answer sets without having to deal with complex tools or programming languages.
        </p>
        {#if new URL(page.url).host === new URL(consts.DOMAIN).host}
          <p>
            Concept, idea and first implementation proudly brought to you by Mario Alviano, Davide Cirimele and Luis Angel Rodriguez Reiners.
            Open source
          </p>
          <p>
            More details on the GitHub repository <code>https://github.com/alviano/asp-chef</code>.
          </p>
        {/if}
        <p>
          <strong>Click for some examples and tutorials!</strong>
        </p>
      </div>
      <NavItem>
        <NavLink href="/s" target="_blank"><Icon name="question-circle" /></NavLink>
      </NavItem>
    </Popover>
  </Nav>
</Navbar>

<style>
  .logo {
    font-family: 'Rock Salt', cursive;
  }
</style>
