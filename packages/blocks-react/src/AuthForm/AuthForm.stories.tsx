import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@wirecore/wirelayer-react';
import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { AuthForm, type AuthFormProps } from './AuthForm.js';

function Demo(args: AuthFormProps) {
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [mode, setMode] = useState(args.defaultMode ?? 'signIn');
    return (
        <AuthForm
            {...args}
            mode={mode}
            onModeChange={(next) => {
                setMode(next);
                setError(undefined);
                setSent(false);
            }}
            error={error}
            loading={loading}
            sent={sent}
            providers={
                <>
                    <Button variant="outline" block leadingIcon={KeyRound}>
                        Sign in with company account (SSO)
                    </Button>
                    <Button variant="outline" block>
                        Sign in with passkey
                    </Button>
                </>
            }
            footer={<p className="m-0 text-center text-xs text-muted">By signing in, you agree to our terms of use.</p>}
            onSubmit={(payload) => {
                setLoading(true);
                setError(undefined);
                setTimeout(() => {
                    setLoading(false);
                    if (payload.mode === 'reset') setSent(true);
                    else if (payload.mode === 'signIn' && payload.password !== 'wirecore') setMode('code');
                    else if (payload.mode === 'code' && payload.code !== '123456')
                        setError('That code is incorrect – please try again.');
                    else setError(undefined);
                }, 600);
            }}
        />
    );
}

const meta = {
    title: 'Blocks/AuthForm',
    component: AuthForm,
    args: { defaultMode: 'signIn', remember: true, passwordMinLength: 8, codeLength: 6 },
    argTypes: { defaultMode: { control: 'inline-radio', options: ['signIn', 'signUp', 'reset', 'code'] } },
    render: (args) => <Demo {...args} />,
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
