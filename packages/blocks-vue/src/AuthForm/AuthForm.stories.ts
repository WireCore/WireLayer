import { KeyRound } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { AuthMode, AuthValues } from '@wirecore/wirelayer-recipes';
import { Button } from '@wirecore/wirelayer-vue';
import { ref } from 'vue';
import AuthForm from './AuthForm.vue';

const meta = {
    title: 'Blocks/AuthForm',
    component: AuthForm,
    args: { defaultMode: 'signIn', remember: true, passwordMinLength: 8, codeLength: 6 },
    argTypes: { defaultMode: { control: 'inline-radio', options: ['signIn', 'signUp', 'reset', 'code'] } },
    render: (args) => ({
        components: { AuthForm, Button },
        setup: () => {
            const error = ref<string>();
            const loading = ref(false);
            const sent = ref(false);
            const mode = ref<AuthMode>(args.defaultMode ?? 'signIn');
            const switchMode = (next: AuthMode) => {
                mode.value = next;
                error.value = undefined;
                sent.value = false;
            };
            const submit = (payload: { mode: AuthMode } & AuthValues) => {
                loading.value = true;
                error.value = undefined;
                setTimeout(() => {
                    loading.value = false;
                    if (payload.mode === 'reset') sent.value = true;
                    else if (payload.mode === 'signIn' && payload.password !== 'wirecore') mode.value = 'code';
                    else if (payload.mode === 'code' && payload.code !== '123456')
                        error.value = 'That code is incorrect – please try again.';
                }, 600);
            };
            return { args, error, loading, sent, mode, switchMode, submit, KeyRound };
        },
        template: `
            <AuthForm
                v-bind="args"
                :mode="mode"
                :error="error"
                :loading="loading"
                :sent="sent"
                @update:mode="switchMode"
                @submit="submit"
            >
                <template #providers>
                    <Button variant="outline" block :leading-icon="KeyRound">Sign in with company account (SSO)</Button>
                    <Button variant="outline" block>Sign in with passkey</Button>
                </template>
                <template #footer>
                    <p class="m-0 text-center text-xs text-muted">By signing in, you agree to our terms of use.</p>
                </template>
            </AuthForm>`,
    }),
} satisfies Meta<typeof AuthForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Sign in, sign up and reset in one form; after signing in a one-time code (here: 123456). Errors in a summary that
 * takes the focus; provider buttons are neutral (no brand logos).
 */
export const Playground: Story = {};

/** Registration with the password length hint */
export const SignUp: Story = { args: { defaultMode: 'signUp' } };
