import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Earth } from 'lucide-react';
import EarthPlanet from '../../../assets/Planets/Earth';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: LoginProps) {
    return (
        <>
            <Head title="Log in" />
            <div className="flex min-h-screen">
                {/* Left side - Login Form */}
                <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-8 relative">
                    {/* Logo en la esquina superior izquierda */}
                    <div className="absolute top-8 left-8 flex items-center gap-2">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-black">
                            <Earth className="size-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">SafeEarth</span>
                    </div>

                    <div className="mx-auto w-full max-w-sm">
                        <Card>
                            <CardHeader>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight">
                                        Welcome back
                                    </h2>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Enter your email and password to access your account
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {status && (
                                    <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                        {status}
                                    </div>
                                )}

                                <Form
                                    {...store.form()}
                                    resetOnSuccess={['password']}
                                    className="space-y-6"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email address</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        required
                                                        autoFocus
                                                        tabIndex={1}
                                                        autoComplete="email"
                                                        placeholder="email@example.com"
                                                    />
                                                    <InputError message={errors.email} />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="password">Password</Label>
                                                        {canResetPassword && (
                                                            <TextLink
                                                                href={request()}
                                                                className="text-sm"
                                                                tabIndex={5}
                                                            >
                                                                Forgot password?
                                                            </TextLink>
                                                        )}
                                                    </div>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        name="password"
                                                        required
                                                        tabIndex={2}
                                                        autoComplete="current-password"
                                                        placeholder="••••••••"
                                                    />
                                                    <InputError message={errors.password} />
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="remember"
                                                        name="remember"
                                                        tabIndex={3}
                                                    />
                                                    <Label 
                                                        htmlFor="remember" 
                                                        className="text-sm font-normal cursor-pointer"
                                                    >
                                                        Remember me
                                                    </Label>
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full"
                                                tabIndex={4}
                                                disabled={processing}
                                                data-test="login-button"
                                            >
                                                {processing && <Spinner />}
                                                Sign in
                                            </Button>

                                            {canRegister && (
                                                <div className="text-center text-sm text-muted-foreground">
                                                    Don't have an account?{' '}
                                                    <TextLink href={register()} tabIndex={6} className="font-medium">
                                                        Sign up
                                                    </TextLink>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right side - 3D Earth Canvas */}
                <div className="hidden lg:block lg:w-1/2 relative bg-black">
                    <Canvas
                        camera={{ position: [0, 0, 5] }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <Suspense fallback={null}>
                            <directionalLight position={[5, 3, 5]} intensity={2} />
                            <Stars radius={300} depth={60} count={5000} factor={7} saturation={0} />
                            <EarthPlanet />
                            <OrbitControls 
                                enableZoom={true}
                                enablePan={false}
                                minDistance={3}
                                maxDistance={10}
                            />
                        </Suspense>
                    </Canvas>
                
                </div>
            </div>
        </>
    );
}
