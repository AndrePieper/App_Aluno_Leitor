import React from 'react';
import StackRoutes from './src/stackRoutes';
import { registerRootComponent } from 'expo';

export default function App() {
  return <StackRoutes />;
}

registerRootComponent(App);
