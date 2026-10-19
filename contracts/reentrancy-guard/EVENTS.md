# Reentrancy Guard Events

This crate provides a transient lock helper and has no independently deployed contract state. Guard acquisition and release are internal call-safety mechanics, so they do not publish business events.
