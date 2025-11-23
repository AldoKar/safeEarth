import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head } from '@inertiajs/react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Earth from '../../../assets/Planets/Earth';

export default function Register() {
    return (
        <>
            <Head title="Register" />
            <div className="flex min-h-screen">
                {/* Left side - Register Form */}
                <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-8">
                    <div className="mx-auto w-full max-w-sm">
                        <div className="mb-10">
                            <h2 className="text-2xl font-bold tracking-tight">
                                Create an account
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Enter your details below to create your account
                            </p>
                        </div>

                        <Form
                            {...store.form()}
                            resetOnSuccess={['password', 'password_confirmation']}
                            disableWhileProcessing
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="name"
                                                name="name"
                                                placeholder="Full name"
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                required
                                                tabIndex={2}
                                                autoComplete="email"
                                                name="email"
                                                placeholder="email@example.com"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                required
                                                tabIndex={3}
                                                autoComplete="new-password"
                                                name="password"
                                                placeholder="••••••••"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="password_confirmation">
                                                Confirm password
                                            </Label>
                                            <Input
                                                id="password_confirmation"
                                                type="password"
                                                required
                                                tabIndex={4}
                                                autoComplete="new-password"
                                                name="password_confirmation"
                                                placeholder="••••••••"
                                            />
                                            <InputError message={errors.password_confirmation} />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        tabIndex={5}
                                        data-test="register-user-button"
                                    >
                                        {processing && <Spinner />}
                                        Create account
                                    </Button>

                                    <div className="text-center text-sm text-muted-foreground">
                                        Already have an account?{' '}
                                        <TextLink href={login()} tabIndex={6} className="font-medium">
                                            Log in
                                        </TextLink>
                                    </div>
                                </>
                            )}
                        </Form>
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
                            <Earth />
                            <OrbitControls 
                                enableZoom={true}
                                enablePan={false}
                                minDistance={3}
                                maxDistance={10}
                            />
                        </Suspense>
                    </Canvas>
                    
                    {/* Overlay text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center text-white">
                            <h1 className="text-4xl font-bold mb-4">SafeEarth</h1>
                            <p className="text-lg text-gray-300">
                                Planetary Defense Simulation System
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
