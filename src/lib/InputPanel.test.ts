import {render, screen} from '@testing-library/svelte';
import InputPanel from './InputPanel.svelte';
import {consts} from "$lib/consts";

describe('<InputPanel />', () => {
  it('should export a textarea value', () => {
    const value = `hello.\n${consts.SYMBOLS.MODELS_SEPARATOR}\nworld.`;
    render(InputPanel, {value: value});
    expect(screen.getByText('Input')).toBeInTheDocument();
    const textarea = screen.getByTestId('InputPanel-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe(value);
  })
});
